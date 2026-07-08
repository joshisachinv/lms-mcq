-- ─────────────────────────────────────────────────────────────────────────
-- Secure exam scoring
--
-- Problem this fixes:
--   Previously the app fetched full question rows (including
--   correct_answers) to the browser before a student answered, then
--   computed the score client-side and inserted it directly into
--   `attempts`. Anyone could read the answer key from the network tab,
--   or call the Supabase API directly to insert a fabricated score.
--
-- Fix:
--   Two SECURITY DEFINER Postgres functions. SECURITY DEFINER functions
--   run with the privileges of the function's owner (normally the
--   `postgres` role you're connected as in the SQL editor), which lets
--   them bypass table-level RLS in a controlled way — only the logic
--   inside the function decides what's exposed, not the caller. This is
--   the pattern Supabase's own docs recommend for "expose a filtered
--   view of a table that RLS would otherwise fully protect."
--
--   1. get_questions_for_exam(exam_id) — returns question content WITHOUT
--      correct_answers. The student-taking-exam screen calls this
--      instead of selecting from `questions` directly.
--
--   2. submit_exam_attempt(...) — takes the student's answers only,
--      looks up correct_answers itself (server-side, never returned to
--      the client beforehand), computes the score, and inserts the
--      attempt row. The client can no longer supply its own `score`.
--
-- How to apply:
--   Paste this file into the Supabase SQL editor for your project and
--   run it (or add it to your migrations if you use the Supabase CLI).
--
-- IMPORTANT — please read before running:
--   This assumes the schema implied by the existing app code:
--     questions(id, subject, topic, difficulty, question_type,
--       question_text, question_image, option_a, option_a_image,
--       option_b, option_b_image, option_c, option_c_image, option_d,
--       option_d_image, correct_answers text[], explanation,
--       timer_seconds, is_archived)
--     exams(id, title, description, overall_timer_seconds, is_active,
--       is_archived, randomize_questions, is_timed)
--     exam_questions(exam_id, question_id, display_order)
--     attempts(id, student_id, student_name, exam_id, exam_title, score,
--       total_questions, answers, scratchpads, question_time_spent,
--       question_time_left, overall_time_spent, overall_time_left,
--       questions_snapshot, submitted_at)
--     profiles(id, email, full_name, role)
--   If any column/table name differs in your actual database, adjust the
--   function bodies below to match before running. Test in a staging
--   project (or take a backup) before running against production data.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Question content for the exam-taking screen — no correct_answers.
create or replace function public.get_questions_for_exam(p_exam_id uuid)
returns table (
  id uuid,
  subject text,
  topic text,
  difficulty text,
  question_type text,
  question_text text,
  question_image text,
  option_a text,
  option_a_image text,
  option_b text,
  option_b_image text,
  option_c text,
  option_c_image text,
  option_d text,
  option_d_image text,
  explanation text,
  timer_seconds integer,
  display_order integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    q.id,
    q.subject,
    q.topic,
    q.difficulty,
    q.question_type,
    q.question_text,
    q.question_image,
    q.option_a,
    q.option_a_image,
    q.option_b,
    q.option_b_image,
    q.option_c,
    q.option_c_image,
    q.option_d,
    q.option_d_image,
    q.explanation,
    q.timer_seconds,
    eq.display_order
  from public.exam_questions eq
  join public.questions q on q.id = eq.question_id
  where eq.exam_id = p_exam_id
  order by eq.display_order;
$$;

revoke all on function public.get_questions_for_exam(uuid) from public;
grant execute on function public.get_questions_for_exam(uuid) to authenticated;

-- 2. Grade the exam and insert the attempt — all server-side.
create or replace function public.submit_exam_attempt(
  p_exam_id uuid,
  p_answers jsonb,
  p_scratchpads jsonb default '{}'::jsonb,
  p_question_time_spent jsonb default '{}'::jsonb,
  p_question_time_left jsonb default '{}'::jsonb,
  p_overall_time_spent integer default 0,
  p_overall_time_left integer default 0
)
returns public.attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_student_name text;
  v_exam_title text;
  v_is_timed boolean;
  v_score integer := 0;
  v_total integer := 0;
  v_snapshot jsonb := '[]'::jsonb;
  v_attempt public.attempts;
begin
  if v_student_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(full_name, email, 'Student')
  into v_student_name
  from public.profiles
  where id = v_student_id;

  select title, is_timed
  into v_exam_title, v_is_timed
  from public.exams
  where id = p_exam_id;

  if v_exam_title is null then
    raise exception 'Exam not found';
  end if;

  -- Grade against the exam's actual question list — never trust question
  -- ids or correct answers supplied by the client.
  select
    count(*) filter (
      where (
        select coalesce(array_agg(value::text order by value::text), array[]::text[])
        from jsonb_array_elements_text(coalesce(p_answers -> q.id::text, '[]'::jsonb))
      ) = (
        select coalesce(array_agg(v order by v), array[]::text[])
        from unnest(coalesce(q.correct_answers, array[]::text[])) v
      )
    ),
    count(*),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'subject', q.subject,
          'topic', coalesce(q.topic, ''),
          'difficulty', coalesce(q.difficulty, ''),
          'questionType', q.question_type,
          'questionText', q.question_text,
          'questionImage', coalesce(q.question_image, ''),
          'optionA', coalesce(q.option_a, ''),
          'optionAImage', coalesce(q.option_a_image, ''),
          'optionB', coalesce(q.option_b, ''),
          'optionBImage', coalesce(q.option_b_image, ''),
          'optionC', coalesce(q.option_c, ''),
          'optionCImage', coalesce(q.option_c_image, ''),
          'optionD', coalesce(q.option_d, ''),
          'optionDImage', coalesce(q.option_d_image, ''),
          'correctAnswers', to_jsonb(coalesce(q.correct_answers, array[]::text[])),
          'explanation', coalesce(q.explanation, ''),
          'timerSeconds', coalesce(q.timer_seconds, 60),
          'isArchived', coalesce(q.is_archived, false)
        )
        order by eq.display_order
      ),
      '[]'::jsonb
    )
  into v_score, v_total, v_snapshot
  from public.exam_questions eq
  join public.questions q on q.id = eq.question_id
  where eq.exam_id = p_exam_id;

  insert into public.attempts (
    student_id, student_name, exam_id, exam_title, score, total_questions,
    answers, scratchpads, question_time_spent, question_time_left,
    overall_time_spent, overall_time_left, questions_snapshot
  ) values (
    v_student_id, v_student_name, p_exam_id, v_exam_title, v_score, v_total,
    p_answers, p_scratchpads, p_question_time_spent, p_question_time_left,
    p_overall_time_spent,
    case when v_is_timed then p_overall_time_left else 0 end,
    v_snapshot
  )
  returning * into v_attempt;

  return v_attempt;
end;
$$;

revoke all on function public.submit_exam_attempt(
  uuid, jsonb, jsonb, jsonb, jsonb, integer, integer
) from public;
grant execute on function public.submit_exam_attempt(
  uuid, jsonb, jsonb, jsonb, jsonb, integer, integer
) to authenticated;

const { query } = require('../config/db');

function perfLabel(avg) {
  if (avg == null) return 'N/A';
  if (avg >= 4.5) return 'Excellent';
  if (avg >= 4.0) return 'Good';
  if (avg >= 3.5) return 'Satisfactory';
  return 'Needs Improvement';
}

function termLabelFromMonthYear(month, year) {
  let term;
  if (month >= 1 && month <= 5) term = 'Spring';
  else if (month >= 6 && month <= 8) term = 'Summer';
  else term = 'Fall';
  return `${term} ${year}`;
}

function analyzeSentimentAndKeywords(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', keywords: [] };
  }
  const t = text.toLowerCase();
  const positiveWords = ['excellent','great','good','helpful','clear','engaging','supportive','organized','outstanding','improved'];
  const negativeWords = ['poor','bad','confusing','unclear','late','rude','unprepared','boring','inconsistent','slow'];
  const constructiveWords = ['improve','should','needs','could','suggest','recommend','better'];

  let pos = 0, neg = 0, cons = 0;
  for (const w of positiveWords) if (t.includes(w)) pos++;
  for (const w of negativeWords) if (t.includes(w)) neg++;
  for (const w of constructiveWords) if (t.includes(w)) cons++;

  let sentiment = 'neutral';
  if (neg > pos && neg >= 1) sentiment = 'negative';
  else if (pos > neg && pos >= 1) sentiment = 'positive';
  else if (cons >= 1) sentiment = 'constructive';

  // rudimentary keyword extraction
  const stop = new Set(['the','is','and','a','an','to','of','in','for','on','with','this','that','it','as','are','was','were','be','been','by','at','or','we','they','you','i','from']);
  const tokens = t
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(x => x && x.length > 2 && !stop.has(x));
  const freq = new Map();
  for (const tok of tokens) freq.set(tok, (freq.get(tok) || 0) + 1);
  const keywords = [...freq.entries()]
    .sort((a,b) => b[1]-a[1])
    .slice(0,3)
    .map(([k]) => k);

  return { sentiment, keywords };
}

async function getProfessorAnalytics({ professor_user_id, start_date=null, end_date=null, course_id_list=null, min_responses=5, evaluator_user_type=null }) {
  if (!professor_user_id) {
    return { error: 'Missing required parameters', missing_parameters: ['professor_user_id'] };
  }
  const courseIds = Array.isArray(course_id_list) ? course_id_list : (
    typeof course_id_list === 'string' && course_id_list.trim().length
      ? course_id_list.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isInteger(n))
      : null
  );
  const minResp = Number.isInteger(min_responses) ? min_responses : 5;
  // Normalize evaluator_user_type (student, faculty, supervisor) or null for all
  const evalType = (typeof evaluator_user_type === 'string' && evaluator_user_type.trim().length)
    ? evaluator_user_type.trim().toLowerCase()
    : null;

  // Evaluatee profile
  const profSql = `
    SELECT u.user_id, u.first_name, u.last_name, COALESCE(u.middle_initial,'') AS middle_initial,
           d.name AS department
    FROM users u
    LEFT JOIN department d ON d.department_id = u.department_id
    WHERE u.user_id::text = $1::text
  `;
  const { rows: profRows } = await query(profSql, [professor_user_id]);
  if (profRows.length === 0) {
    return { error: 'Professor not found', missing_parameters: [] };
  }
  const prof = profRows[0];
  const full_name = [prof.first_name, prof.middle_initial, prof.last_name].filter(Boolean).join(' ').replace(/\s+/g,' ');

  // Core CTEs for filtered and deduped evaluations and per-eval scores
  const coreSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluator_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.overall_score::numeric AS overall_score, e.course_id, e.comments
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    dupes AS (
      SELECT evaluation_id
      FROM filtered_evals_raw
      GROUP BY evaluation_id
      HAVING COUNT(*) > 1
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    ),
    responses_agg AS (
      SELECT r.evaluation_id,
             COUNT(*) AS responses_count,
             SUM(r.rating * COALESCE(NULLIF(q.weight,0),1)) AS weighted_sum,
             SUM(COALESCE(NULLIF(q.weight,0),1)) AS weight_sum
      FROM response r
      JOIN deduped_evals e ON e.evaluation_id = r.evaluation_id
      JOIN question q ON q.question_id = r.question_id
      GROUP BY r.evaluation_id
    ),
    eval_scores AS (
      SELECT e.evaluation_id, e.date_submitted, e.overall_score, e.course_id, e.comments,
             COALESCE(ra.responses_count, 0) AS responses_count,
             CASE WHEN COALESCE(ra.responses_count,0) > 0 AND COALESCE(ra.weight_sum,0) > 0
                  THEN (ra.weighted_sum / ra.weight_sum)
                  ELSE e.overall_score
             END AS eval_score
      FROM deduped_evals e
      LEFT JOIN responses_agg ra ON ra.evaluation_id = e.evaluation_id
    )
    SELECT 
      (SELECT COUNT(*) FROM eval_scores) AS evaluations_count,
      (SELECT AVG(eval_score) FROM eval_scores) AS overall_average,
      (SELECT STDDEV_SAMP(eval_score) FROM eval_scores) AS overall_stddev,
      (SELECT MIN(eval_score) FROM eval_scores) AS min_score,
      (SELECT MAX(eval_score) FROM eval_scores) AS max_score,
      (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY eval_score) FROM eval_scores) AS median,
      (SELECT JSON_AGG(JSON_BUILD_OBJECT('evaluation_id', evaluation_id, 'date_submitted', date_submitted, 'overall_score', overall_score, 'eval_score', eval_score, 'responses_count', responses_count, 'course_id', course_id, 'comments', comments) ORDER BY date_submitted ASC) FROM eval_scores) AS evals_json,
      (SELECT ARRAY_AGG(DISTINCT fe.course_id) FROM filtered_evals_raw fe) AS course_ids,
      (SELECT ARRAY_AGG(d.evaluation_id) FROM dupes d) AS duplicate_eval_ids
  `;

  const { rows: coreRows } = await query(coreSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const core = coreRows[0] || {};
  const evaluations_count = Number(core.evaluations_count || 0);
  const overall_average = core.overall_average != null ? Number(core.overall_average) : null;
  const overall_stddev = core.overall_stddev != null ? Number(core.overall_stddev) : null;
  const min_score = core.min_score != null ? Number(core.min_score) : null;
  const max_score = core.max_score != null ? Number(core.max_score) : null;
  const median = core.median != null ? Number(core.median) : null;
  const evals = core.evals_json || [];
  const course_ids = (core.course_ids || []).filter(x => x !== null);
  const duplicate_eval_ids = (core.duplicate_eval_ids || []).filter(x => x !== null);

  const moe_95 = (evaluations_count && overall_stddev != null)
    ? 1.96 * overall_stddev / Math.sqrt(evaluations_count)
    : null;

  // trend in a separate query (avoid JSON aggregation issues in some PG setups)
  const trendSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluator_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.overall_score::numeric AS overall_score, e.course_id, e.comments
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    ),
    responses_agg AS (
      SELECT r.evaluation_id,
             COUNT(*) AS responses_count,
             SUM(r.rating * COALESCE(NULLIF(q.weight,0),1)) AS weighted_sum,
             SUM(COALESCE(NULLIF(q.weight,0),1)) AS weight_sum
      FROM response r
      JOIN deduped_evals e ON e.evaluation_id = r.evaluation_id
      JOIN question q ON q.question_id = r.question_id
      GROUP BY r.evaluation_id
    ),
    eval_scores AS (
      SELECT e.evaluation_id, e.date_submitted,
             COALESCE(
               CASE WHEN COALESCE(ra.responses_count,0) > 0 AND COALESCE(ra.weight_sum,0) > 0
                    THEN (ra.weighted_sum / ra.weight_sum)
                    ELSE e.overall_score
               END,
               e.overall_score
             ) AS eval_score
      FROM deduped_evals e
      LEFT JOIN responses_agg ra ON ra.evaluation_id = e.evaluation_id
    )
    SELECT 
      CASE 
        WHEN EXTRACT(MONTH FROM es.date_submitted) BETWEEN 1 AND 5 THEN 'Spring'
        WHEN EXTRACT(MONTH FROM es.date_submitted) BETWEEN 6 AND 8 THEN 'Summer'
        ELSE 'Fall'
      END AS term,
      EXTRACT(YEAR FROM es.date_submitted)::int AS year,
      AVG(es.eval_score) AS avg_score,
      COUNT(*) AS evaluations
    FROM eval_scores es
    GROUP BY 
      EXTRACT(YEAR FROM es.date_submitted)::int,
      CASE 
        WHEN EXTRACT(MONTH FROM es.date_submitted) BETWEEN 1 AND 5 THEN 'Spring'
        WHEN EXTRACT(MONTH FROM es.date_submitted) BETWEEN 6 AND 8 THEN 'Summer'
        ELSE 'Fall'
      END
  `;
  const { rows: trendRows } = await query(trendSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const trend = (trendRows || []).map(t => ({
    semester: termLabelFromMonthYear(
      t.term === 'Spring' ? 1 : (t.term === 'Summer' ? 6 : 9),
      t.year
    ),
    avg_score: t.avg_score != null ? Number(t.avg_score) : null,
    evaluations: Number(t.evaluations || 0)
  })).sort((a,b) => {
    const ay = parseInt(a.semester.split(' ')[1], 10) || 0;
    const by = parseInt(b.semester.split(' ')[1], 10) || 0;
    const at = a.semester.startsWith('Spring') ? 1 : a.semester.startsWith('Summer') ? 2 : 3;
    const bt = b.semester.startsWith('Spring') ? 1 : b.semester.startsWith('Summer') ? 2 : 3;
    return ay - by || at - bt;
  });

  // Category breakdown
  const catSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.course_id
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    )
    SELECT c.category_id, c.name,
           SUM(r.rating * COALESCE(NULLIF(q.weight,0),1)) / NULLIF(SUM(COALESCE(NULLIF(q.weight,0),1)), 0) AS avg_score,
           COUNT(*) AS responses,
           STDDEV_SAMP(r.rating) AS stddev
    FROM response r
    JOIN deduped_evals e ON e.evaluation_id = r.evaluation_id
    JOIN question q ON q.question_id = r.question_id
    JOIN category c ON c.category_id = q.category_id
    GROUP BY c.category_id, c.name
    ORDER BY c.category_id
  `;
  const { rows: catRows } = await query(catSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const category_breakdown = catRows.map(r => ({
    category_id: String(r.category_id),
    name: r.name,
    avg_score: r.avg_score != null ? Number(r.avg_score) : null,
    responses: Number(r.responses || 0),
    stddev: r.stddev != null ? Number(r.stddev) : null,
  }));
  for (const c of category_breakdown) {
    c.performance_label = perfLabel(c.avg_score);
    c.low_sample = c.responses < minResp;
  }

  // Question stats
  const qSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.course_id
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    )
    SELECT q.question_id, q.text,
           AVG(r.rating) AS avg_rating,
           STDDEV_SAMP(r.rating) AS stddev,
           COUNT(*) AS responses,
           100.0 * SUM(CASE WHEN r.rating < 3 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct_below_3,
           100.0 * SUM(CASE WHEN r.rating >= 4.5 THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct_ge_4_5
    FROM response r
    JOIN deduped_evals e ON e.evaluation_id = r.evaluation_id
    JOIN question q ON q.question_id = r.question_id
    GROUP BY q.question_id, q.text
    ORDER BY q.question_id
  `;
  const { rows: qRows } = await query(qSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const question_stats = qRows.map(r => ({
    question_id: String(r.question_id),
    text: r.text,
    avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
    stddev: r.stddev != null ? Number(r.stddev) : null,
    responses: Number(r.responses || 0),
    pct_below_3: r.pct_below_3 != null ? Number(r.pct_below_3) : null,
    pct_ge_4_5: r.pct_ge_4_5 != null ? Number(r.pct_ge_4_5) : null,
  }));

  // Top and bottom 5 questions by avg_rating (ignore nulls)
  const qsNonNull = question_stats.filter(q => q.avg_rating != null);
  const top_questions = [...qsNonNull].sort((a,b) => b.avg_rating - a.avg_rating).slice(0,5);
  const bottom_questions = [...qsNonNull].sort((a,b) => a.avg_rating - b.avg_rating).slice(0,5);

  // Comments
  const comSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.comments
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    )
    SELECT evaluation_id, date_submitted, comments
    FROM deduped_evals
    WHERE comments IS NOT NULL AND LENGTH(TRIM(comments)) > 0
    ORDER BY date_submitted DESC
    LIMIT 20
  `;
  const { rows: comRows } = await query(comSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const comments = comRows.map(r => {
    const { sentiment, keywords } = analyzeSentimentAndKeywords(r.comments);
    return {
      evaluation_id: String(r.evaluation_id),
      date_submitted: r.date_submitted,
      text: r.comments,
      sentiment,
      keywords,
    };
  });

  // Data quality checks
  // - evaluations with missing responses
  const evalsParsed = (evals || []).map(e => ({
    evaluation_id: String(e.evaluation_id),
    date_submitted: e.date_submitted,
    overall_score: e.overall_score != null ? Number(e.overall_score) : null,
    eval_score: e.eval_score != null ? Number(e.eval_score) : null,
    responses_count: Number(e.responses_count || 0),
    course_id: e.course_id != null ? Number(e.course_id) : null,
    comments: e.comments,
  }));
  const evaluations_with_missing_responses = evalsParsed.filter(e => e.responses_count === 0).map(e => e.evaluation_id);

  // questions with missing or zero weight
  const qMissingSql = `
    WITH filtered_evals_raw AS (
      SELECT e.evaluation_id, e.evaluatee_id, e.date_submitted::timestamp AS date_submitted,
             e.course_id
      FROM evaluation e
      WHERE e.evaluatee_id::text = $1::text
        AND ($2::date IS NULL OR e.date_submitted::date >= $2::date)
        AND ($3::date IS NULL OR e.date_submitted::date <= $3::date)
        AND ($4::int[] IS NULL OR e.course_id = ANY($4::int[]))
        AND ($5::text IS NULL OR EXISTS (
              SELECT 1 FROM users u
              WHERE u.user_id::text = e.evaluator_id::text
                AND (
                  LOWER(COALESCE(u.user_type, '')) = LOWER($5::text)
                  OR LOWER(COALESCE(u.role, '')) = LOWER($5::text)
                )
            ))
    ),
    deduped_evals AS (
      SELECT * FROM (
        SELECT fe.*, ROW_NUMBER() OVER (PARTITION BY fe.evaluation_id ORDER BY fe.date_submitted ASC) AS rn
        FROM filtered_evals_raw fe
      ) t
      WHERE t.rn = 1
    )
    SELECT DISTINCT q.question_id
    FROM response r
    JOIN deduped_evals e ON e.evaluation_id = r.evaluation_id
    JOIN question q ON q.question_id = r.question_id
    WHERE q.weight IS NULL OR q.weight = 0
  `;
  const { rows: qMissingRows } = await query(qMissingSql, [professor_user_id, start_date, end_date, courseIds, evalType]);
  const questions_with_missing_weight = qMissingRows.map(r => String(r.question_id));

  // low-sample questions
  const low_sample_questions = question_stats.filter(q => q.responses < minResp).map(q => q.question_id);
  const low_sample_categories = category_breakdown.filter(c => c.low_sample).map(c => c.category_id);

  // Performance label for topline
  const performance_label = perfLabel(overall_average);

  // Professor object
  const professor = {
    user_id: String(prof.user_id),
    full_name,
    department: prof.department || null,
    course_ids: course_ids.map(n => Number(n))
  };

  // chart datasets
  const category_bar = category_breakdown.map(c => ({ label: c.name, value: c.avg_score }));
  const trend_line = trend.map(t => ({ label: t.semester, value: t.avg_score }));
  const detailed_table = question_stats;

  // Human summary (4–6 sentences)
  let changeSentence = '';
  if (trend.length >= 2 && trend[trend.length-1].avg_score != null && trend[trend.length-2].avg_score != null) {
    const diff = trend[trend.length-1].avg_score - trend[trend.length-2].avg_score;
    const sign = diff >= 0 ? 'up' : 'down';
    changeSentence = `The latest term average is ${trend[trend.length-1].avg_score.toFixed(2)}, ${sign} ${Math.abs(diff).toFixed(2)} points from the prior term.`;
  }
  const strongCat = category_breakdown.filter(c => c.responses >= minResp).sort((a,b) => (b.avg_score||0) - (a.avg_score||0))[0] || null;
  const weakCat = category_breakdown.filter(c => c.responses >= minResp).sort((a,b) => (a.avg_score||0) - (b.avg_score||0))[0] || null;
  const strongName = strongCat ? strongCat.name : (category_breakdown[0]?.name || 'N/A');
  const weakName = weakCat ? weakCat.name : (category_breakdown[0]?.name || 'N/A');
  const actionable = weakCat ? `Focus on strengthening ${weakName} through targeted feedback, peer observation, or revised course activities.` : `Increase response collection to improve estimate precision.`;
  const sampleCaveat = evaluations_count < minResp || low_sample_categories.length > 0 || low_sample_questions.length > 0
    ? `Sample sizes are limited in some areas (min_responses=${minResp}); interpret results with caution. 95% margin of error is ${moe_95 != null ? moe_95.toFixed(2) : 'N/A'}.`
    : `95% margin of error is ${moe_95 != null ? moe_95.toFixed(2) : 'N/A'}.`;

  // If absolutely no response rows exist, add explicit fallback note
  // Determine if responses exist at all for this professor in filtered range
  const anyResponses = evalsParsed.some(e => e.responses_count > 0);
  const fallbackNote = !anyResponses ? 'No response rows were found; metrics fall back to evaluation.overall_score.' : '';

  const human_summary = [
    `Overall average is ${overall_average != null ? overall_average.toFixed(2) : 'N/A'} across ${evaluations_count} evaluations (min=${min_score != null ? min_score.toFixed(2) : 'N/A'}, max=${max_score != null ? max_score.toFixed(2) : 'N/A'}, median=${median != null ? median.toFixed(2) : 'N/A'}).`,
    changeSentence,
    `Strongest category: ${strongName}. Weakest category: ${weakName}.`,
    actionable,
    sampleCaveat,
    fallbackNote
  ].filter(Boolean).join(' ');

  const json_output = {
    professor,
    topline: {
      evaluations_count,
      overall_average,
      median,
      min: min_score,
      max: max_score,
      stddev: overall_stddev,
      '95_moe': moe_95,
      performance_label
    },
    category_breakdown,
    question_stats,
    trend,
    top_questions: top_questions,
    bottom_questions: bottom_questions,
    comments,
    data_quality: {
      evaluations_with_missing_responses,
      duplicated_evaluation_ids: duplicate_eval_ids || [],
      questions_with_missing_weight,
      low_sample_categories,
      low_sample_questions
    }
  };

  const chart_datasets = {
    category_bar,
    trend_line,
    detailed_table
  };

  return { human_summary, json_output, chart_datasets };
}

module.exports = { getProfessorAnalytics };

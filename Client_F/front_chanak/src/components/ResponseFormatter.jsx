/**
 * ResponseFormatter Component
 * Formats different types of orchestrator responses with proper styling
 */

const ActivityResponse = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-[#FDE047] border-2 border-[#000000] p-4 rounded-lg">
      <h3 className="text-xl font-bold text-[#000000] mb-2">
        🎯 {data.activity_name}
      </h3>
      <p className="text-sm text-[#000000]">{data.description}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-[#000000]">
        <span className="bg-white border border-[#000000] px-2 py-1 rounded">
          ⏱️ {data.duration_minutes} minutes
        </span>
      </div>
    </div>

    <div className="bg-white border-2 border-[#000000] p-4 rounded-lg">
      <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
        📦 Materials Needed
      </h4>
      <ul className="space-y-1 text-sm">
        {data.materials_needed?.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-[#000000]">•</span>
            <span className="text-[#000000]">{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="bg-white border-2 border-[#000000] p-4 rounded-lg">
      <h4 className="font-bold text-[#000000] mb-3 flex items-center gap-2">
        📝 Steps
      </h4>
      <ol className="space-y-3">
        {data.steps?.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#DDD6FE] border-2 border-[#000000] rounded-full flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <span className="text-sm text-[#000000] flex-1 pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>

    <div className="bg-[#D4F1C5] border-2 border-[#000000] p-4 rounded-lg">
      <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
        🎓 Learning Outcome
      </h4>
      <p className="text-sm text-[#000000]">{data.learning_outcome}</p>
    </div>

    {data.tips && data.tips.length > 0 && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          💡 Tips
        </h4>
        <ul className="space-y-2 text-sm">
          {data.tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const ExpertTeacherResponse = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-white border-2 border-[#000000] p-4 rounded-lg">
      <p className="text-sm text-[#000000] leading-relaxed whitespace-pre-wrap">
        {data.explanation}
      </p>
    </div>

    {data.key_points && data.key_points.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          🔑 Key Points
        </h4>
        <ul className="space-y-2 text-sm">
          {data.key_points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.examples && data.examples.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          💡 Examples
        </h4>
        <ul className="space-y-2 text-sm">
          {data.examples.map((example, idx) => (
            <li key={idx} className="text-[#000000]">{example}</li>
          ))}
        </ul>
      </div>
    )}

    {data.teaching_tips && data.teaching_tips.length > 0 && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          👩‍🏫 Teaching Tips
        </h4>
        <ul className="space-y-2 text-sm">
          {data.teaching_tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.common_misconceptions && data.common_misconceptions.length > 0 && (
      <div className="bg-[#F99DA8] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          ⚠️ Common Misconceptions
        </h4>
        <ul className="space-y-2 text-sm">
          {data.common_misconceptions.map((misconception, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{misconception}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.follow_up_questions && data.follow_up_questions.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          ❓ Follow-up Questions
        </h4>
        <ul className="space-y-2 text-sm">
          {data.follow_up_questions.map((question, idx) => (
            <li key={idx} className="text-[#000000]">{question}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const ContentExplanationResponse = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-white border-2 border-[#000000] p-4 rounded-lg">
      <p className="text-sm text-[#000000] leading-relaxed whitespace-pre-wrap">
        {data.explanation}
      </p>
    </div>

    {data.key_points && data.key_points.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          🔑 Key Points
        </h4>
        <ul className="space-y-2 text-sm">
          {data.key_points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.examples && data.examples.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          💡 Examples
        </h4>
        <ul className="space-y-2 text-sm">
          {data.examples.map((example, idx) => (
            <li key={idx} className="text-[#000000]">{example}</li>
          ))}
        </ul>
      </div>
    )}

    {data.sources && data.sources.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2 text-xs">
          📚 NCERT Sources
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.sources.map((source, idx) => (
            <span
              key={idx}
              className="text-xs bg-white border border-[#000000] px-2 py-1 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const DefaultResponse = ({ text }) => (
  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
    {text}
  </p>
);

const TeacherMotivationResponse = ({ data }) => (
  <div className="space-y-4">
    {/* Title */}
    <div className="bg-gradient-to-r from-[#E8D5FF] to-[#DDD6FE] border-2 border-[#000000] p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000]">
      <h3 className="text-2xl font-bold text-[#000000] mb-3">
        💜 {data.motivation_title}
      </h3>
      <p className="text-base text-[#000000] leading-relaxed italic">
        {data.acknowledgment}
      </p>
    </div>

    {/* Immediate Tips */}
    {data.immediate_tips && data.immediate_tips.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          ⚡ Immediate Tips (Use Today!)
        </h4>
        <div className="space-y-3">
          {data.immediate_tips.map((tip, idx) => (
            <div key={idx} className="flex gap-3 bg-white border-2 border-[#000000] p-3 rounded">
              <span className="flex-shrink-0 w-7 h-7 bg-[#FDE047] border-2 border-[#000000] rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <p className="text-sm text-[#000000] flex-1 pt-0.5">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Long-term Strategies */}
    {data.long_term_strategies && data.long_term_strategies.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          🎯 Long-term Strategies
        </h4>
        <ul className="space-y-2">
          {data.long_term_strategies.map((strategy, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-[#000000] text-lg">✓</span>
              <span className="text-sm text-[#000000] flex-1">{strategy}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Inspiration */}
    {data.inspiration && (
      <div className="bg-gradient-to-r from-[#F99DA8] to-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          ✨ Remember This
        </h4>
        <p className="text-base text-[#000000] leading-relaxed font-medium">
          {data.inspiration}
        </p>
      </div>
    )}

    {/* Self-care Practices */}
    {data.self_care_practices && data.self_care_practices.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          🧘 Self-care Practices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.self_care_practices.map((practice, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-white border border-[#000000] p-3 rounded">
              <span className="text-[#000000]">•</span>
              <span className="text-sm text-[#000000]">{practice}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Perspective Shifts */}
    {data.perspective_shifts && data.perspective_shifts.length > 0 && (
      <div className="bg-white border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          🔄 Perspective Shifts
        </h4>
        <ul className="space-y-2">
          {data.perspective_shifts.map((shift, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-[#000000] text-lg">→</span>
              <span className="text-sm text-[#000000] flex-1">{shift}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const CrisisHandlerResponse = ({ data }) => (
  <div className="space-y-4">
    {/* Crisis Title */}
    {data.crisis_type && (
      <div className="bg-[#F99DA8] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h3 className="text-xl font-bold text-[#000000] mb-2 flex items-center gap-2">
          🚨 Crisis: {data.crisis_type}
        </h3>
        {data.severity && (
          <span className="inline-block bg-white border-2 border-[#000000] px-3 py-1 rounded text-sm font-bold">
            Severity: {data.severity}
          </span>
        )}
      </div>
    )}

    {/* Immediate Actions */}
    {data.immediate_actions && data.immediate_actions.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          ⚡ Immediate Actions
        </h4>
        <ol className="space-y-3">
          {data.immediate_actions.map((action, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-[#F99DA8] border-2 border-[#000000] rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <span className="text-sm text-[#000000] flex-1 pt-0.5">{action}</span>
            </li>
          ))}
        </ol>
      </div>
    )}

    {/* De-escalation Techniques */}
    {data.deescalation_techniques && data.deescalation_techniques.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          🕊️ De-escalation Techniques
        </h4>
        <ul className="space-y-2">
          {data.deescalation_techniques.map((technique, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-sm text-[#000000]">{technique}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Prevention Strategies */}
    {data.prevention_strategies && data.prevention_strategies.length > 0 && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          🛡️ Prevention Strategies
        </h4>
        <ul className="space-y-2">
          {data.prevention_strategies.map((strategy, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">✓</span>
              <span className="text-sm text-[#000000]">{strategy}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Follow-up Actions */}
    {data.followup_actions && data.followup_actions.length > 0 && (
      <div className="bg-white border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          📋 Follow-up Actions
        </h4>
        <ul className="space-y-2">
          {data.followup_actions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">→</span>
              <span className="text-sm text-[#000000]">{action}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/**
 * Main ResponseFormatter Component
 */
const ResponseFormatter = ({ toolUsed, result, text }) => {
  // If no structured result, show plain text
  if (!result || typeof result !== 'object') {
    return <DefaultResponse text={text} />;
  }

  // Format based on tool type
  switch (toolUsed) {
    case 'activity_generator':
      return <ActivityResponse data={result} />;
    
    case 'expert_teacher':
      return <ExpertTeacherResponse data={result} />;
    
    case 'content_explainer':
      return <ContentExplanationResponse data={result} />;
    
    case 'teacher_motivation':
      return <TeacherMotivationResponse data={result} />;
    
    case 'crisis_handler':
      // Crisis handler returns activity-like structure
      if (result.activity_name) {
        return <ActivityResponse data={result} />;
      }
      return <CrisisHandlerResponse data={result} />;
    
    case 'classroom_guidance':
      // Classroom guidance can use expert teacher format
      return <ExpertTeacherResponse data={result} />;
    
    default:
      return <DefaultResponse text={text} />;
  }
};

export default ResponseFormatter;

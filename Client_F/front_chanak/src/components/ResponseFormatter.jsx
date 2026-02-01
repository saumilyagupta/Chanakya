/**
 * ResponseFormatter Component
 * Formats different types of orchestrator responses with proper styling
 */

import {
  ClipboardList,
  Package,
  List,
  BookOpen,
  Lightbulb,
  CheckCircle,
  Sparkles,
  Presentation,
  AlertTriangle,
  HelpCircle,
  Heart,
  Rocket,
  Target,
  Flower2,
  RotateCcw,
  Info,
  Zap,
  Handshake,
  ShieldCheck,
  Check,
} from "lucide-react";

// Utility function to parse text with bold formatting (**text**)
const parseBoldText = (text) => {
  if (!text) return text;
  
  const parts = [];
  let lastIndex = 0;
  const regex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push(<strong key={match.index} className="font-bold">{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

/**
 * Quick Answer Response
 * For simple calculations, facts, and short queries
 */
const QuickAnswerResponse = ({ data }) => {
  const answer = data.answer || "";

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-[#000000] p-6 rounded-lg shadow-[3px_3px_0px_0px_#000000]"
        style={{ backgroundColor: "#A7F3D0" }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Zap size={24} className="text-[#000000]" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-[#000000] opacity-70 uppercase tracking-wide mb-2">
              Quick Answer
            </div>
            <p className="text-2xl font-bold text-[#000000] leading-relaxed">
              {parseBoldText(answer)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * General Conversation Response
 * For greetings, gratitude, clarifications, and out-of-scope queries
 */
const GeneralConversationResponse = ({ data }) => {
  const responseType = data.response_type || "general";
  const response = data.response || "";
  const suggestedTopics = data.suggested_topics || [];

  // Icons for different response types
  const icons = {
    greeting: <Handshake size={20} className="text-[#000000]" />,
    gratitude: <Heart size={20} className="text-[#000000]" />,
    clarification: <HelpCircle size={20} className="text-[#000000]" />,
    out_of_scope: <Info size={20} className="text-[#000000]" />,
    unclear: <AlertTriangle size={20} className="text-[#000000]" />,
    general: <Sparkles size={20} className="text-[#000000]" />,
  };

  const colors = {
    greeting: "#D4F1C5",
    gratitude: "#FFB7C5",
    clarification: "#FDE047",
    out_of_scope: "#E0EEEF",
    unclear: "#FFE4B5",
    general: "#E8D5FF",
  };

  const bgColor = colors[responseType] || colors.general;
  const icon = icons[responseType] || icons.general;

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">{icon}</div>
          <p className="text-base text-[#000000] leading-relaxed flex-1">
            {parseBoldText(response)}
          </p>
        </div>

        {suggestedTopics.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-[#000000]">
            <p className="text-sm font-bold text-[#000000] mb-2">
              I can help you with:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="bg-white border-2 border-[#000000] px-3 py-1 rounded-full text-xs font-medium text-[#000000] shadow-[2px_2px_0px_0px_#000000]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityResponse = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-[#EDF4EC] border-2 border-[#000000] p-4 rounded-lg">
      <h3 className="text-xl font-bold text-[#000000] mb-2 flex items-center gap-2">
        <ClipboardList size={18} /> {data.activity_name}
      </h3>
      <p className="text-sm text-[#000000]">{parseBoldText(data.description)}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-[#000000]">
        <span className="bg-white border border-[#000000] px-2 py-1 rounded">
          Duration: {data.duration_minutes} minutes
        </span>
      </div>
    </div>

    <div className="bg-[#feffdf] border-2 border-[#000000] p-4 rounded-lg">
      <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
        <Package size={18} /> Materials Needed
      </h4>
      <ul className="space-y-1 text-sm">
        {data.materials_needed?.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-[#000000]">•</span>
            <span className="text-[#000000]">{parseBoldText(item)}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="bg-[#ffefed] border-2 border-[#000000] p-4 rounded-lg">
      <h4 className="font-bold text-[#000000] mb-3 flex items-center gap-2">
        <List size={18} /> Steps
      </h4>
      <div className="space-y-3">
        {data.steps?.map((step, idx) => (
          <div key={idx} className="flex gap-3 bg-white border-2 border-[#000000] p-3 rounded">
            <span className="flex-shrink-0 w-6 h-6 bg-[#D4F1C5] border-2 border-[#000000] rounded-full flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <span className="text-sm text-[#000000] flex-1 pt-0.5">{parseBoldText(step)}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
      <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
        <BookOpen size={18} /> Learning Outcome
      </h4>
      <p className="text-sm text-[#000000]">{parseBoldText(data.learning_outcome)}</p>
    </div>

    {data.tips && data.tips.length > 0 && (
      <div className="bg-gradient-to-r from-[#E8D5FF] to-[#DDD6FE] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <Lightbulb size={18} /> Tips
        </h4>
        <ul className="space-y-2 text-sm">
          {data.tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{parseBoldText(tip)}</span>
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
        {parseBoldText(data.explanation)}
      </p>
    </div>

    {data.key_points && data.key_points.length > 0 && (
      <div className="bg-[#EDF4EC] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <CheckCircle size={18} /> Key Points
        </h4>
        <ul className="space-y-2 text-sm">
          {data.key_points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{parseBoldText(point)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.examples && data.examples.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Examples
        </h4>
        <ul className="space-y-2 text-sm">
          {data.examples.map((example, idx) => (
            <li key={idx} className="text-[#000000]">
              {example}
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.teaching_tips && data.teaching_tips.length > 0 && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <Presentation size={18} /> Teaching Tips
        </h4>
        <ul className="space-y-2 text-sm">
          {data.teaching_tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{parseBoldText(tip)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.common_misconceptions && data.common_misconceptions.length > 0 && (
      <div className="bg-[#F99DA8] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <AlertTriangle size={18} /> Common Misconceptions
        </h4>
        <ul className="space-y-2 text-sm">
          {data.common_misconceptions.map((misconception, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{parseBoldText(misconception)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.follow_up_questions && data.follow_up_questions.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <HelpCircle size={18} /> Follow-up Questions
        </h4>
        <ul className="space-y-2 text-sm">
          {data.follow_up_questions.map((question, idx) => (
            <li key={idx} className="text-[#000000]">
              {question}
            </li>
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
        {parseBoldText(data.explanation)}
      </p>
    </div>

    {data.key_points && data.key_points.length > 0 && (
      <div className="bg-[#EDF4EC] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <CheckCircle size={18} /> Key Points
        </h4>
        <ul className="space-y-2 text-sm">
          {data.key_points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">•</span>
              <span className="text-[#000000]">{parseBoldText(point)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.examples && data.examples.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
          <Sparkles size={18} /> Examples
        </h4>
        <ul className="space-y-2 text-sm">
          {data.examples.map((example, idx) => (
            <li key={idx} className="text-[#000000]">
              {parseBoldText(example)}
            </li>
          ))}
        </ul>
      </div>
    )}

    {data.sources && data.sources.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-4 rounded-lg">
        <h4 className="font-bold text-[#000000] mb-2 flex items-center gap-2 text-xs">
          <BookOpen size={18} /> NCERT Sources
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
    {parseBoldText(text)}
  </p>
);

/**
 * Classroom Guidance Response
 * For classroom management strategies and pedagogical guidance
 */
const ClassroomGuidanceResponse = ({ data }) => (
  <div className="space-y-4">
    {/* Situation Analysis */}
    {data.situation_analysis && (
      <div className="bg-white border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Info size={20} /> Understanding the Situation
        </h4>
        <p className="text-sm text-[#000000] leading-relaxed">
          {parseBoldText(data.situation_analysis)}
        </p>
      </div>
    )}

    {/* Immediate Tips */}
    {data.immediate_tips && data.immediate_tips.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Zap size={20} /> Quick Tips (Try Today!)
        </h4>
        <div className="space-y-3">
          {data.immediate_tips.map((tip, idx) => (
            <div
              key={idx}
              className="flex gap-3 bg-white border-2 border-[#000000] p-3 rounded"
            >
              <span className="flex-shrink-0 w-7 h-7 bg-[#FDE047] border-2 border-[#000000] rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <p className="text-sm text-[#000000] flex-1 pt-0.5">{parseBoldText(tip)}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Step-by-Step Strategies */}
    {data.step_by_step_strategies && data.step_by_step_strategies.length > 0 && (
      <div className="space-y-4">
        <h4 className="text-lg font-bold text-[#000000] flex items-center gap-2">
          <Target size={20} /> Detailed Strategies
        </h4>
        {data.step_by_step_strategies.map((strategy, idx) => (
          <div
            key={idx}
            className="bg-[#E0EEEF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]"
          >
            <h5 className="font-bold text-[#000000] mb-2 flex items-center gap-2">
              <Presentation size={18} /> {strategy.strategy_name}
            </h5>
            
            <div className="space-y-2 mb-3">
              {strategy.steps && strategy.steps.map((step, stepIdx) => (
                <div key={stepIdx} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-white border-2 border-[#000000] rounded-full flex items-center justify-center text-xs font-bold">
                    {stepIdx + 1}
                  </span>
                  <p className="text-sm text-[#000000] pt-0.5">{parseBoldText(step)}</p>
                </div>
              ))}
            </div>

            {strategy.why_it_works && (
              <div className="mt-3 pt-3 border-t-2 border-[#000000]">
                <p className="text-xs font-bold text-[#000000] mb-1 flex items-center gap-1">
                  <Lightbulb size={14} /> Why It Works:
                </p>
                <p className="text-sm text-[#000000] italic">
                  {parseBoldText(strategy.why_it_works)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Long-term Approach */}
    {data.long_term_approach && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Target size={20} /> Long-term Approach
        </h4>
        <p className="text-sm text-[#000000] leading-relaxed">
          {parseBoldText(data.long_term_approach)}
        </p>
      </div>
    )}

    {/* Rural Adaptations */}
    {data.rural_adaptations && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Flower2 size={20} /> Rural Context Adaptations
        </h4>
        <p className="text-sm text-[#000000] leading-relaxed">
          {parseBoldText(data.rural_adaptations)}
        </p>
      </div>
    )}

    {/* Encouragement */}
    {data.encouragement && (
      <div className="bg-gradient-to-r from-[#F99DA8] to-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Heart size={20} /> You've Got This!
        </h4>
        <p className="text-sm text-[#000000] leading-relaxed">
          {parseBoldText(data.encouragement)}
        </p>
      </div>
    )}
  </div>
);

const TeacherMotivationResponse = ({ data }) => (
  <div className="space-y-4">
    {/* Title */}
    <div className="bg-gradient-to-r from-[#E8D5FF] to-[#DDD6FE] border-2 border-[#000000] p-6 rounded-lg shadow-[4px_4px_0px_0px_#000000]">
      <h3 className="text-2xl font-bold text-[#000000] mb-3 flex items-center gap-2">
        {data.motivation_title}
      </h3>
      <p className="text-base text-[#000000] leading-relaxed italic">
        {parseBoldText(data.acknowledgment)}
      </p>
    </div>

    {/* Immediate Tips */}
    {data.immediate_tips && data.immediate_tips.length > 0 && (
      <div className="bg-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Rocket size={20} /> Immediate Tips (Use Today!)
        </h4>
        <div className="space-y-3">
          {data.immediate_tips.map((tip, idx) => (
            <div
              key={idx}
              className="flex gap-3 bg-white border-2 border-[#000000] p-3 rounded"
            >
              <span className="flex-shrink-0 w-7 h-7 bg-[#FDE047] border-2 border-[#000000] rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <p className="text-sm text-[#000000] flex-1 pt-0.5">{parseBoldText(tip)}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Long-term Strategies */}
    {data.long_term_strategies && data.long_term_strategies.length > 0 && (
      <div className="bg-[#D4F1C5] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Target size={20} /> Long-term Strategies
        </h4>
        <ul className="space-y-2">
          {data.long_term_strategies.map((strategy, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-[#000000] text-lg">✓</span>
              <span className="text-sm text-[#000000] flex-1">{parseBoldText(strategy)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Inspiration */}
    {data.inspiration && (
      <div className="bg-gradient-to-r from-[#F99DA8] to-[#FDE047] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Sparkles size={20} /> Remember This
        </h4>
        <p className="text-base text-[#000000] leading-relaxed font-medium">
          {parseBoldText(data.inspiration)}
        </p>
      </div>
    )}

    {/* Self-care Practices */}
    {data.self_care_practices && data.self_care_practices.length > 0 && (
      <div className="bg-[#E0EEEF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Flower2 size={20} /> Self-care Practices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.self_care_practices.map((practice, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-white border border-[#000000] p-3 rounded"
            >
              <span className="text-[#000000]">•</span>
              <span className="text-sm text-[#000000]">{parseBoldText(practice)}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Perspective Shifts */}
    {data.perspective_shifts && data.perspective_shifts.length > 0 && (
      <div className="bg-white border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <RotateCcw size={20} /> Perspective Shifts
        </h4>
        <ul className="space-y-2">
          {data.perspective_shifts.map((shift, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-[#000000] text-lg">→</span>
              <span className="text-sm text-[#000000] flex-1">{parseBoldText(shift)}</span>
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
          <Info size={20} /> Crisis: {data.crisis_type}
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
          <Zap size={20} /> Immediate Actions
        </h4>
        <ol className="space-y-3">
          {data.immediate_actions.map((action, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-[#F99DA8] border-2 border-[#000000] rounded-full flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
              <span className="text-sm text-[#000000] flex-1 pt-0.5">
                {action}
              </span>
            </li>
          ))}
        </ol>
      </div>
    )}

    {/* De-escalation Techniques */}
    {data.deescalation_techniques &&
      data.deescalation_techniques.length > 0 && (
        <div className="bg-[#D4F1C5] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
          <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
            <Handshake size={20} /> De-escalation Techniques
          </h4>
          <ul className="space-y-2">
            {data.deescalation_techniques.map((technique, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#000000]">•</span>
                <span className="text-sm text-[#000000]">{parseBoldText(technique)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    {/* Prevention Strategies */}
    {data.prevention_strategies && data.prevention_strategies.length > 0 && (
      <div className="bg-[#E8D5FF] border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <ShieldCheck size={20} /> Prevention Strategies
        </h4>
        <ul className="space-y-2">
          {data.prevention_strategies.map((strategy, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">✓</span>
              <span className="text-sm text-[#000000]">{parseBoldText(strategy)}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Follow-up Actions */}
    {data.followup_actions && data.followup_actions.length > 0 && (
      <div className="bg-white border-2 border-[#000000] p-5 rounded-lg shadow-[3px_3px_0px_0px_#000000]">
        <h4 className="text-lg font-bold text-[#000000] mb-3 flex items-center gap-2">
          <Check size={20} /> Follow-up Actions
        </h4>
        <ul className="space-y-2">
          {data.followup_actions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#000000]">→</span>
              <span className="text-sm text-[#000000]">{parseBoldText(action)}</span>
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
  if (!result || typeof result !== "object") {
    return <DefaultResponse text={text} />;
  }

  // Format based on tool type
  switch (toolUsed) {
    case "quick_answer":
      return <QuickAnswerResponse data={result} />;

    case "general_conversation":
      return <GeneralConversationResponse data={result} />;

    case "activity_generator":
      return <ActivityResponse data={result} />;

    case "expert_teacher":
      return <ExpertTeacherResponse data={result} />;

    case "content_explainer":
      return <ContentExplanationResponse data={result} />;

    case "teacher_motivation":
      return <TeacherMotivationResponse data={result} />;

    case "crisis_handler":
      // Crisis handler returns activity-like structure
      if (result.activity_name) {
        return <ActivityResponse data={result} />;
      }
      return <CrisisHandlerResponse data={result} />;

    case "classroom_guidance":
      return <ClassroomGuidanceResponse data={result} />;

    default:
      return <DefaultResponse text={text} />;
  }
};

export default ResponseFormatter;

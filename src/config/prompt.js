export function promptTranscriptSummary(conversationString) {
  const prompt = `
You are a conversation analysis assistant for a travel agency.

Please analyze the following **Hebrew-language** conversation between a **travel agent** and a **customer**.

Return the result as a **valid JSON object** with all **field names and field key will english but values written in Hebrew only**.

- All numeric values in the JSON output must be valid numbers (not strings).
- All text values in the JSON output must be valid strings (enclosed in double quotes).

Your output must include **ten comprehensive sections**:

1. **"summary"** – Executive summary of the conversation  
2. **"analysis"** – Core factual analysis of the conversation  
3. **"insights"** – Deeper insights, emotional score, and recommended next steps  
4. **"service_score"** – A service & sales performance score breakdown  
5. **"technical_analysis"** – Technical conversation metrics  
6. **"financial_analysis"** – In-depth financial discussion analysis  
7. **"booking_details"** – Specific travel booking information  
8. **"behavioral_analysis"** – Customer behavior patterns  
9. **"emotional_analysis"** – Advanced emotional journey mapping  
10. **"business_intelligence"** – Strategic business insights  

---

JSON format example:

\`\`\`json
{
  "summary": "",
  "analysis": {
    "conversation_summary": "",
    "customer_intent": "",
    "destination": "",
    "budget_constraint": true,
    "objections": [],
    "next_step_recommendation": "",
    "interest_level": "high / medium / low",
    "overall_sentiment": "positive / neutral / negative",
    "call_status": "deal closed / follow-up required / not interested",
    "agent_improvement": "",
    "upsell_opportunities": [],
    "additional_services": [],
    "unanswered_questions": [],
    "customer_profile": "",
    "conversation_stage": "beginning / middle / closing stage",
    "booking_readiness": "high / medium / low",
    "competition_mentions": true,
    "tags": []
  },
  "insights": {
    "emotion_score_0_to_1": 0.0,
    "engagement_level": "high / medium / low",
    "conversion_probability": 0.0,
    "keywords": [],
    "recommended_actions": []
  },
  "service_score": {
    "message_clarity": 1,
    "empathy_and_understanding": 1,
    "process_control": 1,
    "professional_language": 1,
    "need_identification": 1,
    "call_to_action": 1,
    "expected_satisfaction": 1,
    "upsell_opportunity": 1,
    "average_score": 0.0,
    "comments": ""
  },
  "technical_analysis": {
    "call_duration_minutes": 0,
    "agent_talk_time_percentage": 0,
    "customer_talk_time_percentage": 0,
    "interruption_count": 0,
    "silence_periods_count": 0,
    "conversation_flow_score": 0,
    "topic_changes_count": 0,
    "speaking_pace": "fast / normal / slow",
    "conversation_clarity": "clear / moderate / unclear"
  },
  "financial_analysis": {
    "total_amount_discussed": 0,
    "payment_issues_identified": true,
    "discount_requested": true,
    "budget_flexibility_level": "high / medium / low",
    "price_sensitivity": "high / medium / low",
    "payment_method_discussed": "",
    "installment_options_discussed": true,
    "price_objections": [],
    "financial_concerns": [],
    "payment_timeline": ""
  },
  "booking_details": {
    "travel_dates": "",
    "destination_confirmed": "",
    "group_size": 0,
    "children_count": 0,
    "adults_count": 0,
    "special_requirements": [],
    "accommodation_type": "",
    "room_preferences": [],
    "transportation_included": true,
    "meal_plans_discussed": [],
    "activities_mentioned": [],
    "travel_duration_days": 0
  },
  "behavioral_analysis": {
    "decision_making_style": "analytical / impulsive / collaborative / cautious",
    "trust_level_with_agent": "high / medium / low",
    "urgency_level": "high / medium / low",
    "research_level": "well-researched / some-research / minimal-research",
    "comparison_shopping": true,
    "family_decision_dynamics": "",
    "communication_style": "direct / diplomatic / emotional / logical",
    "negotiation_approach": "assertive / passive / collaborative",
    "risk_tolerance": "high / medium / low"
  },
  "emotional_analysis": {
    "stress_indicators": [],
    "excitement_moments": [],
    "frustration_points": [],
    "confidence_level": "high / medium / low",
    "emotional_journey": [],
    "satisfaction_peaks": [],
    "anxiety_triggers": [],
    "emotional_stability": "stable / fluctuating / volatile",
    "trust_building_moments": []
  },
  "business_intelligence": {
    "advanced_service_analysis": {
      "problem_resolution_speed": "fast / medium / slow",
      "proactive_assistance_score": 0,
      "knowledge_demonstration": "excellent / good / needs-improvement",
      "personalization_level": "high / medium / low",
      "follow_up_commitment": true,
      "error_recovery_effectiveness": "excellent / good / poor"
    },
    "business_potential": {
      "revenue_potential": "high / medium / low",
      "customer_lifetime_value": "high / medium / low",
      "referral_likelihood": 0,
      "repeat_business_probability": 0,
      "upsell_success_probability": 0,
      "cross_sell_opportunities": []
    },
    "communication_analysis": {
      "communication_style_match": "excellent / good / poor",
      "cultural_sensitivity_score": 0,
      "technical_explanation_clarity": "clear / adequate / unclear",
      "active_listening_demonstration": true,
      "empathy_moments": [],
      "rapport_building_success": "high / medium / low"
    },
    "competitive_analysis": {
      "competitor_mentions": [],
      "price_comparison_discussed": true,
      "unique_value_proposition_highlighted": true,
      "market_position_strength": "strong / average / weak",
      "competitive_advantages_used": []
    },
    "success_metrics": {
      "goal_achievement_score": 0,
      "customer_effort_score": 0,
      "first_call_resolution": true,
      "escalation_needed": false,
      "follow_up_scheduled": true,
      "commitment_level": "high / medium / low",
      "next_contact_timeline": "",
      "success_probability": 0
    }
  }
}
\`\`\`

Conversation:
${conversationString}
`;

  return prompt;
}

export function promptTranscriptSummaryGpt4_1(conversationString) {
  const prompt = `
You are a conversation analysis assistant for a travel agency.

Analyze the following **Hebrew-language** conversation between a **travel agent** and a **customer**.

Return the result as a **valid JSON object** with:
- **All field names in English**
- **All text values written in Hebrew only**
- **All numeric values as real numbers (not strings)**
- Output **JSON only**, no explanations or markdown.

Include exactly the following ten sections:

{
  "summary": "",
  "analysis": {
    "conversation_summary": "",
    "customer_intent": "",
    "destination": "",
    "budget_constraint": true,
    "objections": [],
    "next_step_recommendation": "",
    "interest_level": "high / medium / low",
    "overall_sentiment": "positive / neutral / negative",
    "call_status": "deal closed / follow-up required / not interested",
    "agent_improvement": "",
    "upsell_opportunities": [],
    "additional_services": [],
    "unanswered_questions": [],
    "customer_profile": "",
    "conversation_stage": "beginning / middle / closing stage",
    "booking_readiness": "high / medium / low",
    "competition_mentions": true,
    "tags": []
  },
  "insights": {
    "emotion_score_0_to_1": 0.0,
    "engagement_level": "high / medium / low",
    "conversion_probability": 0.0,
    "keywords": [],
    "recommended_actions": []
  },
  "service_score": {
    "message_clarity": 1,
    "empathy_and_understanding": 1,
    "process_control": 1,
    "professional_language": 1,
    "need_identification": 1,
    "call_to_action": 1,
    "expected_satisfaction": 1,
    "upsell_opportunity": 1,
    "average_score": 0.0,
    "comments": ""
  },
  "technical_analysis": {
    "call_duration_minutes": 0,
    "agent_talk_time_percentage": 0,
    "customer_talk_time_percentage": 0,
    "interruption_count": 0,
    "silence_periods_count": 0,
    "conversation_flow_score": 0,
    "topic_changes_count": 0,
    "speaking_pace": "fast / normal / slow",
    "conversation_clarity": "clear / moderate / unclear"
  },
  "financial_analysis": {
    "total_amount_discussed": 0,
    "payment_issues_identified": true,
    "discount_requested": true,
    "budget_flexibility_level": "high / medium / low",
    "price_sensitivity": "high / medium / low",
    "payment_method_discussed": "",
    "installment_options_discussed": true,
    "price_objections": [],
    "financial_concerns": [],
    "payment_timeline": ""
  },
  "booking_details": {
    "travel_dates": "",
    "destination_confirmed": "",
    "group_size": 0,
    "children_count": 0,
    "adults_count": 0,
    "special_requirements": [],
    "accommodation_type": "",
    "room_preferences": [],
    "transportation_included": true,
    "meal_plans_discussed": [],
    "activities_mentioned": [],
    "travel_duration_days": 0
  },
  "behavioral_analysis": {
    "decision_making_style": "analytical / impulsive / collaborative / cautious",
    "trust_level_with_agent": "high / medium / low",
    "urgency_level": "high / medium / low",
    "research_level": "well-researched / some-research / minimal-research",
    "comparison_shopping": true,
    "family_decision_dynamics": "",
    "communication_style": "direct / diplomatic / emotional / logical",
    "negotiation_approach": "assertive / passive / collaborative",
    "risk_tolerance": "high / medium / low"
  },
  "emotional_analysis": {
    "stress_indicators": [],
    "excitement_moments": [],
    "frustration_points": [],
    "confidence_level": "high / medium / low",
    "emotional_journey": [],
    "satisfaction_peaks": [],
    "anxiety_triggers": [],
    "emotional_stability": "stable / fluctuating / volatile",
    "trust_building_moments": []
  },
  "business_intelligence": {
    "advanced_service_analysis": {
      "problem_resolution_speed": "fast / medium / slow",
      "proactive_assistance_score": 0,
      "knowledge_demonstration": "excellent / good / needs-improvement",
      "personalization_level": "high / medium / low",
      "follow_up_commitment": true,
      "error_recovery_effectiveness": "excellent / good / poor"
    },
    "business_potential": {
      "revenue_potential": "high / medium / low",
      "customer_lifetime_value": "high / medium / low",
      "referral_likelihood": 0,
      "repeat_business_probability": 0,
      "upsell_success_probability": 0,
      "cross_sell_opportunities": []
    },
    "communication_analysis": {
      "communication_style_match": "excellent / good / poor",
      "cultural_sensitivity_score": 0,
      "technical_explanation_clarity": "clear / adequate / unclear",
      "active_listening_demonstration": true,
      "empathy_moments": [],
      "rapport_building_success": "high / medium / low"
    },
    "competitive_analysis": {
      "competitor_mentions": [],
      "price_comparison_discussed": true,
      "unique_value_proposition_highlighted": true,
      "market_position_strength": "strong / average / weak",
      "competitive_advantages_used": []
    },
    "success_metrics": {
      "goal_achievement_score": 0,
      "customer_effort_score": 0,
      "first_call_resolution": true,
      "escalation_needed": false,
      "follow_up_scheduled": true,
      "commitment_level": "high / medium / low",
      "next_contact_timeline": "",
      "success_probability": 0
    }
  }
}

Conversation to analyze:
${conversationString}

Respond ONLY with a valid JSON object matching the schema above.
Do NOT include markdown, backticks, explanations, or any extra text.
If uncertain, output empty strings or empty arrays instead of omitting fields.
`;

  return prompt;
}

export function promptTranscriptSummaryProcessbk(conversationString) {
  const prompt = `Analyze this Hebrew travel agent-customer conversation. Return valid JSON with English keys, Hebrew values. 

**Rules:**
- Numbers as numeric type (use 0 for unknown)
- Text as strings (use empty "" for unknown)
- Booleans: true/false only
- Enums: pick ONE value only (e.g., "high" not "high/medium/low")
- Service scores: 1-5 scale (1=poor, 5=excellent)
- Dates: "DD/MM/YYYY" format or empty ""
- If conversation is too short/incomplete, fill what's available and mark others as empty/0/false

\`\`\`json
{
  "summary": "",
  "analysis": {
    "conversation_summary": "",
    "customer_intent": "",
    "destination": "",
    "budget_constraint": false,
    "objections": [],
    "interest_level": "",
    "overall_sentiment": ""
  },
  "insights": {
    "conversion_probability": 0.0,
    "engagement_level": "",
    "urgency_level": "",
    "booking_readiness": ""
  },
  "service_score": {
    "message_clarity": 0,
    "empathy_and_understanding": 0,
    "need_identification": 0,
    "call_to_action": 0,
    "average_score": 0.0
  },
  "quality_checklist": {
    "explained_company": false,
    "built_itinerary_with_days": false,
    "explained_cancellation_policy": false,
    "committed_best_price": false,
    "separated_itinerary_from_hotels": false,
    "aligned_price_expectations": false,
    "created_personal_connection": false,
    "led_conversation": false
  },
  "financial_analysis": {
    "total_amount_discussed": 0,
    "budget_flexibility_level": "",
    "price_sensitivity": "",
    "discount_requested": false,
    "payment_method_discussed": "",
    "price_objections": [],
    "exchange_rate_discussed": false,
    "exchange_rate_concerns": []
  },
  "booking_details": {
    "travel_dates": "",
    "destination_confirmed": "",
    "adults_count": 0,
    "children_count": 0,
    "travel_duration_days": 0,
    "special_requirements": [],
    "accommodation_type": "",
    "transportation_included": false
  }
}
\`\`\`

Conversation:
${conversationString}`;
  return prompt;
}

export function promptTranscriptSummaryProcess(conversationString) {
  const prompt = `Analyze this Hebrew travel agent-customer conversation. Return valid JSON with English keys, Hebrew values. 

**Rules:**
- Numbers as numeric type (use 0 for unknown)
- Text as strings (use empty "" for unknown)
- Booleans: true/false only
- Enums: pick ONE value only (e.g., "high" not "high/medium/low")
- Service scores: 1-5 scale (1=poor, 5=excellent)
- Dates: "DD/MM/YYYY" format or empty ""
- If conversation is too short/incomplete, fill what's available and mark others as empty/0/false

\`\`\`json
{
  "summary": "",
  "analysis": {
    "conversation_summary": "",
    "customer_intent": "",
    "destination": "",
    "budget_constraint": false,
    "objections": [],
    "interest_level": "",
    "overall_sentiment": ""
  },
  "insights": {
    "conversion_probability": 0.0,
    "engagement_level": "",
    "urgency_level": "",
    "booking_readiness": ""
  },
  "service_score": {
    "message_clarity": 0,
    "empathy_and_understanding": 0,
    "need_identification": 0,
    "call_to_action": 0,
    "average_score": 0.0
  },
  "quality_checklist": {
    "explained_company": false,
    "built_itinerary_with_days": false,
    "explained_cancellation_policy": false,
    "committed_best_price": false,
    "separated_itinerary_from_hotels": false,
    "aligned_price_expectations": false,
    "created_personal_connection": false,
    "led_conversation": false
  },
  "financial_analysis": {
    "total_amount_discussed": 0,
    "budget_flexibility_level": "",
    "price_sensitivity": "",
    "discount_requested": false,
    "payment_method_discussed": "",
    "price_objections": [],
    "exchange_rate_discussed": false,
    "exchange_rate_concerns": [],
    
    
    "competitors_mentioned": false,
    "competitors_details": "",

    "payment_terms_or_exchange_rates_resistance": false,
    "payment_terms_or_exchange_rates_resistance_details": "",

    "cancellation_policy_resistance": false,
    "cancellation_policy_resistance_details": ""
  },
  "booking_details": {
    "travel_dates": "",
    "destination_confirmed": "",
    "adults_count": 0,
    "children_count": 0,
    "travel_duration_days": 0,
    "special_requirements": [],
    "accommodation_type": "",
    "transportation_included": false,

    "agent_advised_independent_flight_booking": false,
    "agent_advised_independent_flight_booking_details": ""
  }
}

\`\`\`

Conversation:
${conversationString}`;
  return prompt;
}
 
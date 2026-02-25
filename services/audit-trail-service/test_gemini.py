import asyncio
from config.settings import get_settings
from shared_ai.factory import get_ai_provider
import google.generativeai as genai

async def main():
    ai = get_ai_provider()
    print("Using provider:", ai.get_provider_name())
    
    prompt = """You are a pharmaceutical compliance analyst for a company using the eSTAR (Electronic Stability Testing and Reporting) AI Platform. Generate a concise, professional compliance report based on the following data.

SYSTEM DATA:
- Total anomalies detected: 47
- Compliance score: 66%
- Total integrity checks: 6
- Checks passed: 4

RECENT ANOMALIES:
- [CRITICAL] unauthorized: Same field edited 4 times in one session by user jdoe (user: jdoe, risk: 88.0)

INTEGRITY VIOLATIONS:
- missing_signature: Missing electronic signature on critical action (user: jdoe, action: batch_release)

INTEGRITY CHECKS:
- Sequential event numbering: PASSED — Passed
- Electronic signatures present: FAILED — 1 missing

INSTRUCTIONS:
- Write a narrative compliance summary suitable for regulatory review
- Include sections: CRITICAL FINDINGS, OPERATIONAL SUMMARY, RECOMMENDATIONS
- Use professional pharmaceutical regulatory language
- Reference 21 CFR Part 11 compliance requirements
- Keep the report under 500 words
- Do not use markdown formatting — use plain text with ALL-CAPS section headers and bullet points (•)"""

    system_instruction = "You are an expert pharmaceutical compliance auditor."
    
    res = await ai.generate_text(
        prompt=prompt,
        system_instruction=system_instruction,
        temperature=0.4,
        max_tokens=1500,
    )
    print("TEXT LENGTH:", len(res))
    print("TEXT PREVIEW:", repr(res[:300]))

asyncio.run(main())

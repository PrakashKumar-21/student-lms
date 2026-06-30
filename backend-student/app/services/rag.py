from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.catalog import Subject, SubjectChunk
from app.services.embeddings import embed_texts, get_openai_client

settings = get_settings()


# ---------- GREETING HELPERS ----------

def is_greeting(message: str) -> bool:
    greetings = {
        "hi", "hello", "hey", "hii", "hiii",
        "good morning", "good afternoon", "good evening",
        "namaste", "hola"
    }
    msg = message.lower().strip()
    return msg in greetings or any(msg.startswith(g) for g in greetings)


def greeting_reply(subject: str | None, subject_id: UUID | None) -> str:
    if subject_id:
        return (
            "Hello 😊 I’m your teacher.\n\n"
            "You can ask me questions from your syllabus, "
            "and I’ll explain them step by step like a real teacher."
        )

    return (
        "Hello 😊 I’m your AI tutor.\n\n"
        "Please select a board, class, and subject to start learning."
    )



def _build_prompt(context: str, question: str) -> str:
    return f"""
You are a school teacher explaining answers to students

YOUR JOB:
1. Understand the question
2. Decide if it is a MATH or THEORY question
3. Answer using ONLY the context
4. Return ONLY valid JSON


STRICT RULES:
- Use ONLY the context below for explanations and examples
- Explain the solution step by step like a teacher
- Definitions of basic syllabus terms (HCF, LCM, factor, multiple, polynomial, etc.) are allowed
- Do NOT answer personal or celebrity questions
- If the question is completely outside the subject or syllabus, return "Answer not found"
- No markdown
- No text outside JSON


IF THE QUESTION IS OUTSIDE THE SYLLABUS OR CONTEXT:
Return ONLY this JSON:

{{
  "type": "theory",
  "title": "Answer not found",
  "explanation": [
    "This question is not related to the selected subject or syllabus."
  ]
}}

FOR MATH QUESTIONS:
- Explain like a school teacher
- Do NOT mix explanation and equation
- Explanation and expression must be separate

FORMAT (MATH):
{{
  "type": "math",
  "given": [],
  "steps": [
    {{
      "title": "",
      "explanation": "",
      "expression": ""
    }}
  ],
  "final_answer": ""
}}

FORMAT (THEORY):
{{
  "type": "theory",
  "title": "",
  "explanation": []
}}

CONTEXT:
{context}

QUESTION:
{question}

Return ONLY the JSON.
"""




def generate_reply(
    db: Session,
    message: str,
    subject_id: UUID | None,
    board: str | None,
    class_level: str | None,
    subject: str | None,
) -> tuple[str, list[str]]:

    # GREETING HANDLING 
    if is_greeting(message):
        return greeting_reply(subject, subject_id), []

    
    if not subject_id:
        context = ""
        if board and class_level and subject:
            context = f" ({board} {class_level} - {subject})"
        reply = (
            f"Here is a guided answer{context}: {message}.\n"
            "Let's break it into steps and examples."
        )
        return reply, []


    if not subject:
        subject_row = db.query(Subject).filter(Subject.id == subject_id).first()
        if subject_row:
            subject = subject_row.name

    query_embedding = embed_texts([message])[0]
    chunks = (
        db.query(SubjectChunk)
        .filter(SubjectChunk.subject_id == subject_id)
        .order_by(SubjectChunk.embedding.cosine_distance(query_embedding))
        .limit(5)
        .all()
    )
    if not chunks:
        return "No relevant study material found for this question.", []
    
    

    context = "\n\n".join(chunk.content for chunk in chunks)
    prompt = _build_prompt(context=context, question=message)
    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=[
            {
                "role": "system",
                   "content": (
                    "You are a retrieval-based educational AI. "
                    "You must answer questions ONLY using the provided context. "
                    "You are strictly forbidden from using any outside or general knowledge. "
                    "If the required information is not present in the context, "
                    "you must clearly state that it is not available in the given study material. "
                    "Never guess or add new facts."
                )
            },
            {"role": "user", "content": prompt},
        ],
    )
    reply = response.choices[0].message.content or ""
    citations = [chunk.content[:200] for chunk in chunks]
    return reply, citations


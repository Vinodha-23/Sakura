"""
Simple Streamlit chat against free NVIDIA NIM (OpenAI-compatible).

Supports:
  - Text generation
  - Multimodal: optional image upload + question (vision models)

Secrets / env:
  NVIDIA_API_KEY=nvapi-...
"""

from __future__ import annotations

import base64
import os

import streamlit as st
from openai import OpenAI

TEXT_MODELS = {
    "Llama 3.1 8B (text)": "meta/llama-3.1-8b-instruct",
    "Nemotron 3 Nano 30B (text)": "nvidia/nemotron-3-nano-30b-a3b",
    "Nemotron Ultra 550B (text)": "nvidia/nemotron-3-ultra-550b-a55b",
}

VISION_MODELS = {
    "Llama 3.2 11B Vision": "meta/llama-3.2-11b-vision-instruct",
    "Nemotron Nano VL 8B": "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
    "Nemotron Nano 12B VL": "nvidia/nemotron-nano-12b-v2-vl",
    "Llama 4 Maverick (multimodal)": "meta/llama-4-maverick-17b-128e-instruct",
}

st.set_page_config(page_title="NVIDIA NIM Chat", page_icon="🌸", layout="centered")
st.title("NVIDIA NIM — free text + multimodal")
st.caption("OpenAI-compatible gateway → integrate.api.nvidia.com/v1")

with st.sidebar:
    st.header("Configuration")
    nvidia_api_key = st.text_input(
        "NVIDIA API Key",
        value=os.environ.get("NVIDIA_API_KEY", ""),
        type="password",
        help="Get a free key at build.nvidia.com (nvapi-…)",
    )
    mode = st.radio("Mode", ["Text", "Multimodal (image + text)"], index=0)
    if mode == "Text":
        model_label = st.selectbox("Model", list(TEXT_MODELS.keys()))
        selected_model_id = TEXT_MODELS[model_label]
    else:
        model_label = st.selectbox("Vision model", list(VISION_MODELS.keys()))
        selected_model_id = VISION_MODELS[model_label]
        uploaded = st.file_uploader("Image", type=["png", "jpg", "jpeg", "webp"])
    st.markdown(f"`{selected_model_id}`")
    if st.button("Clear chat"):
        st.session_state.chat_history = []
        st.rerun()

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

for message in st.session_state.chat_history:
    with st.chat_message(message["role"]):
        if message.get("image_bytes"):
            st.image(message["image_bytes"], use_container_width=True)
        st.markdown(message["content"])


def build_user_content(text: str, image_bytes: bytes | None, mime: str | None):
    if not image_bytes:
        return text
    b64 = base64.b64encode(image_bytes).decode("ascii")
    return [
        {"type": "text", "text": text},
        {
            "type": "image_url",
            "image_url": {"url": f"data:{mime or 'image/png'};base64,{b64}"},
        },
    ]


if user_input := st.chat_input("Ask the model something..."):
    image_bytes = None
    mime = None
    if mode.startswith("Multimodal"):
        if not uploaded:
            st.error("Upload an image in the sidebar for multimodal mode.")
            st.stop()
        image_bytes = uploaded.getvalue()
        mime = uploaded.type or "image/png"

    with st.chat_message("user"):
        if image_bytes:
            st.image(image_bytes, use_container_width=True)
        st.markdown(user_input)

    st.session_state.chat_history.append(
        {
            "role": "user",
            "content": user_input,
            "image_bytes": image_bytes,
            "mime": mime,
        }
    )

    if not nvidia_api_key:
        st.error("Missing API key. Paste nvapi-… in the sidebar (or set NVIDIA_API_KEY).")
        st.stop()

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=nvidia_api_key,
    )

    messages_payload = [
        {
            "role": "system",
            "content": "You are a helpful, expert AI assistant.",
        }
    ]
    for msg in st.session_state.chat_history:
        if msg["role"] == "user" and msg.get("image_bytes"):
            content = build_user_content(
                msg["content"], msg.get("image_bytes"), msg.get("mime")
            )
        else:
            content = msg["content"]
        messages_payload.append({"role": msg["role"], "content": content})

    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        try:
            stream = client.chat.completions.create(
                model=selected_model_id,
                messages=messages_payload,
                temperature=0.7,
                max_tokens=2048,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_response += delta
                    response_placeholder.markdown(full_response + "▌")
            response_placeholder.markdown(full_response)
            st.session_state.chat_history.append(
                {"role": "assistant", "content": full_response}
            )
        except Exception as err:
            st.error(f"Inference failed: {err}")

st.sidebar.markdown("---")
st.sidebar.caption(
    "Free developer tier: rate-limited (~40 RPM). "
    "Text-to-image uses separate GenAI endpoints (see scripts/test-nvidia-t2i.mjs)."
)

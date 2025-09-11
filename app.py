from flask import Flask, render_template, request, jsonify
import requests, json, os
from datetime import datetime

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["CAPTURE_FOLDER"] = "captures"

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["CAPTURE_FOLDER"], exist_ok=True)

API_KEY = "sk-xxxxxxxxxxxxxxxxxxxx"  # Replace with your API key
MODEL = "deepseek/deepseek-r1:free"
url = "https://openrouter.ai/api/v1/chat/completions"

messages = [{"role": "system", "content": "You are a helpful assistant."}]

def chat_with_gpt(user_input, file_text=""):
    content = user_input
    if file_text:
        content += f"\n\n[Attached File Content]\n{file_text}"

    messages.append({"role": "user", "content": content})
    payload = {"model": MODEL, "messages": messages}
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        reply = response.json()["choices"][0]["message"]["content"]
        messages.append({"role": "assistant", "content": reply})
        return reply
    else:
        return f"Error: {response.status_code} - {response.text}"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.form.get("message", "")
    file_text = ""

    # Handle uploaded files
    if "files" in request.files:
        uploaded_files = request.files.getlist("files")
        for file in uploaded_files:
            # Save captured images separately in captures folder
            if file.filename.startswith("captured_"):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                capture_path = os.path.join(app.config["CAPTURE_FOLDER"], f"{timestamp}.png")
                file.save(capture_path)
            else:
                filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
                file.save(filepath)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        file_text += f"\n--- {file.filename} ---\n{f.read()}\n"
                except:
                    file_text += f"\n[File {file.filename} uploaded but not readable as text]\n"

    reply = chat_with_gpt(user_input, file_text)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)

import subprocess, os, time, sys

def start_backend():
    return subprocess.Popen([
        sys.executable,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ], cwd=os.path.abspath("."))

def start_frontend():
    # Use npx serve build for fast, reliable serving, fallback to npm start if build missing
    frontend_dir = os.path.abspath(os.path.join("frontend"))
    build_dir = os.path.join(frontend_dir, "build")
    if os.path.isdir(build_dir):
        return subprocess.Popen(["npx", "serve", "-s", "build", "-l", "3000"], cwd=frontend_dir, shell=True)
    return subprocess.Popen(["npm", "start"], cwd=frontend_dir, shell=True)

if __name__ == "__main__":
    print("🚀 Starting NetShield backend and frontend...")
    b_proc = start_backend()
    # give backend a moment to start
    time.sleep(2)
    f_proc = start_frontend()
    print("✅ Both services launched.")
    print("👉 Frontend: http://localhost:3000")
    print("👉 Backend API Docs: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to terminate both servers.")
    try:
        b_proc.wait()
        f_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        b_proc.terminate()
        f_proc.terminate()
        print("Shutdown complete.")

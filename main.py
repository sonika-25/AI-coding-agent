from fastapi import FastAPI
import os
import uvicorn

app=FastAPI()

@app.get("/ping")
async def ping():
    return "No, you return. fucking sala!"
def main():
    print("Hello from loveable-clone!")


if __name__ == "__main__":
    uvicorn.run(app, host='localhost', port = 8000)
    main()

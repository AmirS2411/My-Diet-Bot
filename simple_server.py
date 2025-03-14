from flask import Flask, render_template_string

app = Flask(__name__)

@app.route('/')
def home():
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Diet Bot Test Server</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
                background-color: #f5f5f5;
            }
            h1 {
                color: #2c3e50;
                text-align: center;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-top: 40px;
            }
            .success {
                color: #27ae60;
                font-weight: bold;
            }
            .card {
                background-color: #f9f9f9;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                border-left: 4px solid #3498db;
            }
            .button {
                display: inline-block;
                background-color: #3498db;
                color: white;
                padding: 10px 15px;
                border-radius: 4px;
                text-decoration: none;
                margin-top: 15px;
                cursor: pointer;
            }
            .button:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Diet Bot Test Server</h1>
            <p class="success">✓ Flask server is running successfully!</p>
            
            <div class="card">
                <h3>Server Information</h3>
                <p>This is a simple Flask server created to test local server functionality.</p>
                <p>Current time: <span id="time"></span></p>
            </div>
            
            <div class="card">
                <h3>Project Structure</h3>
                <p>Your Diet Bot project appears to be a React application built with Vite.</p>
                <p>To run the actual React application, you would typically need Node.js installed.</p>
            </div>
            
            <div class="card">
                <h3>Test Interaction</h3>
                <button class="button" id="testButton">Click Me!</button>
                <p id="buttonResult"></p>
            </div>
        </div>

        <script>
            // Update the time every second
            function updateTime() {
                const timeElement = document.getElementById('time');
                timeElement.textContent = new Date().toLocaleTimeString();
            }
            
            // Update time immediately and then every second
            updateTime();
            setInterval(updateTime, 1000);
            
            // Add button click event
            document.getElementById('testButton').addEventListener('click', function() {
                document.getElementById('buttonResult').textContent = 'Button clicked at ' + new Date().toLocaleTimeString();
            });
        </script>
    </body>
    </html>
    """
    return render_template_string(html)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)

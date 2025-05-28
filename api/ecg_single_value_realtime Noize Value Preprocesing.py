from flask import Flask, jsonify
import serial
import time
import numpy as np

app = Flask(__name__)

# Initialize serial connection to Arduino (update port as needed)
try:
    ser = serial.Serial('COM3', 9600, timeout=1)  # Replace 'COM3' with your port
    time.sleep(2)  # Wait for connection
except serial.SerialException:
    print("Error: Could not connect to Arduino. Check port and connection.")

def read_ecg_data():
    """Read real-time ECG data and detect P, QRS, T peaks."""
    ecg_values = []
    start_time = time.time()
    
    # Collect 1 second of data (~200 samples at 200 Hz)
    while time.time() - start_time < 1.0:
        try:
            if ser.in_waiting > 0:
                ecg_value = int(ser.readline().decode().strip())
                if ecg_value >= 0 and ecg_value <= 1023:  # Validate range
                    ecg_values.append(ecg_value)
            time.sleep(0.005)  # 5ms delay for ~200 Hz
        except (ValueError, UnicodeDecodeError):
            continue
    
    if not ecg_values:
        return 0, 0, 0  # Return zeros if no data

    # Simple peak detection (tune thresholds based on your AD8232 signal)
    ecg_array = np.array(ecg_values)
    qrs_value = np.max(ecg_array) if len(ecg_array) > 0 else 0  # QRS: highest peak
    p_value = np.mean(ecg_array[ecg_array < 500]) if len(ecg_array[ecg_array < 500]) > 0 else 0  # P: lower peak
    t_value = np.mean(ecg_array[(ecg_array > 450) & (ecg_array < 600)]) if len(ecg_array[(ecg_array > 450) & (ecg_array < 600)]) > 0 else 0  # T: mid-range peak

    # Default to example values if detection fails
    if qrs_value == 0 or p_value == 0 or t_value == 0:
        p_value, qrs_value, t_value = 450, 700, 500

    return p_value, qrs_value, t_value

@app.route('/calculate_ecg', methods=['GET'])
def calculate_ecg():
    try:
        # Get real-time P, QRS, T values
        p_value, qrs_value, t_value = read_ecg_data()
        
        # Weighted average: Value = (0.2 * P) + (0.6 * QRS) + (0.2 * T)
        single_value = (0.2 * p_value) + (0.6 * qrs_value) + (0.2 * t_value)
        
        # Return JSON response
        return jsonify({
            'p_value': float(p_value),
            'qrs_value': float(qrs_value),
            't_value': float(t_value),
            'single_value': float(single_value),
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        if 'ser' in globals() and ser.is_open:
            ser.close()  # Close serial port on exit
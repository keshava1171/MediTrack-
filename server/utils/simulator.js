const EventEmitter = require('events');

class DeviceSimulator extends EventEmitter {
    constructor() {
        super();
        this.interval = null;
    }

    startSimulation() {
        
        if (this.interval) return;

        console.log('Starting Device Simulation...');
        this.interval = setInterval(() => {
            const data = this.generateData();
            this.emit('data', data);
            this.checkAlerts(data);
        }, 3000); 
    }

    stopSimulation() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('Stopped Device Simulation');
        }
    }

    generateData() {
        
        return {
            heartRate: Math.floor(Math.random() * (120 - 55) + 55),
            bpSystolic: Math.floor(Math.random() * (150 - 100) + 100),
            bpDiastolic: Math.floor(Math.random() * (95 - 60) + 60),
            spo2: Math.floor(Math.random() * (100 - 88) + 88),
            timestamp: new Date()
        };
    }

    checkAlerts(data) {
        if (data.heartRate > 100) {
            this.emit('alert', { type: 'Heart Rate', value: data.heartRate, message: 'High Heart Rate Detected!' });
        } else if (data.heartRate < 60) {
            this.emit('alert', { type: 'Heart Rate', value: data.heartRate, message: 'Low Heart Rate Detected!' });
        }

        if (data.bpSystolic > 140 || data.bpDiastolic > 90) {
            this.emit('alert', { type: 'Blood Pressure', value: `${data.bpSystolic}/${data.bpDiastolic}`, message: 'High Blood Pressure Detected!' });
        }

        if (data.spo2 < 90) {
            this.emit('alert', { type: 'SpO2', value: data.spo2, message: 'Low SpO2 Levels Detected!' });
        }
    }
}

module.exports = new DeviceSimulator();

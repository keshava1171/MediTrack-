import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import alertReducer from '../features/alerts/alertSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        alerts: alertReducer,
    },
});

import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    alerts: [],
    unreadCount: 0,
};
export const alertSlice = createSlice({
    name: 'alerts',
    initialState,
    reducers: {
        addAlert: (state, action) => {
            state.alerts.unshift(action.payload); 
            state.unreadCount += 1;
        },
        markAllAsRead: (state) => {
            state.unreadCount = 0;
            state.alerts.forEach(alert => alert.isRead = true);
        },
        addNewAlert: (state, action) => {
            state.alerts.unshift(action.payload);
            state.unreadCount += 1;
        },
        clearAlerts: (state) => {
            state.alerts = [];
            state.unreadCount = 0;
        }
    },
});
export const { addAlert, markAllAsRead, addNewAlert, clearAlerts } = alertSlice.actions;
export default alertSlice.reducer;

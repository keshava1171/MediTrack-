import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { addNewAlert } from '../features/alerts/alertSlice';

const socket = io(import.meta.env.VITE_API_URL);

const GlobalAlertListener = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!user) return;

                socket.emit('user_connected', user.id || user._id);

        socket.on('healthAlert', (alert) => {
                        dispatch(addNewAlert(alert));
        });

        return () => {
            socket.off('healthAlert');
        };
    }, [user, dispatch]);

    return null;
};

export default GlobalAlertListener;

import { format } from 'date-fns';

export const formatDateForAPI = (date) => {
    return format(date, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date) => {
    return format(date, 'EEEE, MMMM do');
};

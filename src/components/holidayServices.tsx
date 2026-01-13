import apiClient from "./services/apiClient";

/* Interfaces */

export type HolidayType = 'PUBLIC_HOLIDAY' | 'RESTRICTED_HOLIDAY';

export interface HolidayRequestDto {
    name: string;
    date: string; // YYYY-MM-DD
    holidayType: HolidayType;
}

export interface HolidayResponseDto {
    id: number;
    name: string;
    date: string; // YYYY-MM-DD
    holidayType: HolidayType;
    companyId: number;
}

// Weekdays in Java: MONDAY, TUESDAY...
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WeeklyOffRequestDto {
    companyId: number;
    daysOfWeek: DayOfWeek[];
    year: number;
}

export interface WeeklyOffResponseDto {
    id: number;
    companyId: number;
    dayOfWeek: DayOfWeek;
    isActive: boolean;
    year: number;
}

export interface ResponseWrapper<T> {
    statusCode: number;
    statusMessage: string;
    data: T;
}

// Endpoints
const HOLIDAY_BASE_URL = "/settings/leaveConfiguration/holidays";
const WEEKLY_OFF_BASE_URL = "/settings/leaveConfiguration/weeklyOff";

// Holiday APIs
export const addHoliday = async (data: HolidayRequestDto) => {
    const response = await apiClient.post<ResponseWrapper<HolidayResponseDto>>(`${HOLIDAY_BASE_URL}/add`, data);
    return response.data;
};

export const getHolidays = async () => {
    const response = await apiClient.get<ResponseWrapper<HolidayResponseDto[]>>(`${HOLIDAY_BASE_URL}`);
    return response.data;
};

export const getHolidayById = async (id: number) => {
    const response = await apiClient.get<ResponseWrapper<HolidayResponseDto>>(`${HOLIDAY_BASE_URL}/${id}`);
    return response.data;
};

export const updateHoliday = async (id: number, data: HolidayRequestDto) => {
    const response = await apiClient.put<ResponseWrapper<HolidayResponseDto>>(`${HOLIDAY_BASE_URL}/${id}`, data);
    return response.data;
};

export const deleteHoliday = async (id: number) => {
    const response = await apiClient.delete<ResponseWrapper<null>>(`${HOLIDAY_BASE_URL}/${id}`);
    return response.data;
};

// Weekly Off APIs
export const addWeeklyOff = async (data: WeeklyOffRequestDto) => {
    // Note: The controller returns List<WeeklyOffResponseDto>
    const response = await apiClient.post<ResponseWrapper<WeeklyOffResponseDto[]>>(`${WEEKLY_OFF_BASE_URL}/add`, data);
    return response.data;
};

export const getActiveWeeklyOffs = async () => {
    const response = await apiClient.get<ResponseWrapper<WeeklyOffResponseDto[]>>(`${WEEKLY_OFF_BASE_URL}/active`);
    return response.data;
};

// Placeholder for getWeeklyOffById if strictly required by interface but not available in backend
// We will rely on getActiveWeeklyOffs for list view
export const getWeeklyOffById = async (id: number) => {
    // This endpoint was not found in the controller provided.
    // If it exists, it would be:
    // return apiClient.get<ResponseWrapper<WeeklyOffResponseDto>>(`${WEEKLY_OFF_BASE_URL}/${id}`);
    throw new Error("API getWeeklyOffById not integrated due to missing backend endpoint");
};

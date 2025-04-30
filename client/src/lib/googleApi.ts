import { apiRequest } from "./queryClient";

// Function to get Google OAuth URL
export async function getGoogleAuthUrl(): Promise<string> {
  try {
    const response = await apiRequest("GET", "/api/google/auth-url");
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Failed to get Google auth URL:", error);
    throw error;
  }
}

// Function to export students to Google Sheets
export async function exportStudentsToSheets(classId: number): Promise<{ message: string }> {
  try {
    const response = await apiRequest("POST", "/api/google/export-students", { classId });
    return await response.json();
  } catch (error) {
    console.error("Failed to export students:", error);
    throw error;
  }
}

// Function to export attendance to Google Sheets
export async function exportAttendanceToSheets(classId: number, date: Date): Promise<{ message: string }> {
  try {
    const response = await apiRequest("POST", "/api/google/export-attendance", { 
      classId, 
      date: date.toISOString() 
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to export attendance:", error);
    throw error;
  }
}

// Function to check if browser is online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Function to handle offline data
export function saveOfflineAttendance(data: any): void {
  const offlineData = JSON.parse(localStorage.getItem('offlineAttendance') || '[]');
  offlineData.push(data);
  localStorage.setItem('offlineAttendance', JSON.stringify(offlineData));
}

// Function to sync offline data when online
export async function syncOfflineAttendance(): Promise<boolean> {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineAttendance') || '[]');
    
    if (offlineData.length === 0) {
      return true;
    }

    // Process each offline record
    for (const record of offlineData) {
      await apiRequest("POST", "/api/attendance", record);
    }
    
    // Clear offline data after successful sync
    localStorage.removeItem('offlineAttendance');
    return true;
  } catch (error) {
    console.error("Failed to sync offline attendance:", error);
    return false;
  }
}

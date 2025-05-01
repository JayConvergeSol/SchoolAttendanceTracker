import { SheetsIntegration } from "@shared/schema";

// This file handles the interaction with Google Sheets API
// The SPREADSHEET_ID represents the Google Sheet where data will be stored
const SPREADSHEET_ID = "1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY";

// Direct Save to Google Sheets function
export async function directSaveStudentToSheet(student: any): Promise<boolean> {
  try {
    const values = [
      [
        student.studentId,
        student.name,
        student.email || '',
        student.contactPhone || '',
        student.address || '',
        String(student.classId)
      ]
    ];
    
        // This approach works with sheets shared with "Anyone with the link" with edit permissions
    // No API key needed - direct access to public sheets
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Student:A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to append student data: ${response.statusText}`, errorText);
      return false;
    }

    console.log("Successfully saved student to Google Sheet:", student.name);
    return true;
  } catch (error) {
    console.error('Error directly saving student to sheet:', error);
    return false;
  }
}

// Direct save attendance to sheet function
export async function directSaveAttendanceToSheet(
  date: string,
  className: string,
  studentId: string,
  name: string,
  status: string
): Promise<boolean> {
  try {
    const values = [
      [date, className, studentId, name, status]
    ];
    
    // This works with sheets shared with "Anyone with the link" with edit permissions
    // No API key needed for public sheets
    
    // Direct API call to Google Sheets
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/attendance:A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to append attendance data: ${response.statusText}`, errorText);
      return false;
    }

    console.log("Successfully saved attendance to Google Sheet for:", name);
    return true;
  } catch (error) {
    console.error('Error directly saving attendance to sheet:', error);
    return false;
  }
}

// Function to use the predefined spreadsheet for attendance tracking
export async function createAttendanceSpreadsheet(accessToken: string, title: string): Promise<string | null> {
  // Instead of creating a new spreadsheet, use the predefined one
  const predefinedSpreadsheetId = "1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY";
  
  try {
    // Verify that we can access the spreadsheet (optional validation)
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${predefinedSpreadsheetId}?fields=sheets.properties.title`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`Failed to access predefined spreadsheet: ${response.statusText}`);
      return null;
    }
    
    // Return the predefined spreadsheet ID
    return predefinedSpreadsheetId;
  } catch (error) {
    console.error('Error accessing predefined spreadsheet:', error);
    return null;
  }
}

// Function to append attendance data to a Google Sheet
export async function appendAttendanceData(
  integration: SheetsIntegration,
  date: string,
  className: string,
  attendanceRecords: Array<{ 
    studentId: string, 
    name: string, 
    status: string 
  }>
): Promise<boolean> {
  try {
    const values = attendanceRecords.map(record => [
      date,
      className,
      record.studentId,
      record.name,
      record.status
    ]);

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${integration.sheetId}/values/attendance:A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to append data: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error appending attendance data:', error);
    return false;
  }
}

// Function to append student data to a Google Sheet
export async function appendStudentData(
  integration: SheetsIntegration,
  students: Array<{
    id: number,
    studentId: string,
    name: string,
    email: string | null,
    contactPhone: string | null,
    address: string | null,
    classId: number,
    avatar?: string | null,
    contactInfo?: unknown
  }>
): Promise<boolean> {
  try {
    const values = students.map(student => [
      student.studentId,
      student.name,
      student.email || '',
      student.contactPhone || '',
      student.address || '',
      String(student.classId)
    ]);

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${integration.sheetId}/values/Student:A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to append student data: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error appending student data:', error);
    return false;
  }
}

// Function to get OAuth 2.0 URL for Google authentication
export function getGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', scopes.join(' '));
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent');

  return url.toString();
}

// Function to exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return null;
  }
}

// Function to refresh an expired access token
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

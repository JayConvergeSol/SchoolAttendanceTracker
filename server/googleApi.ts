import { SheetsIntegration } from "@shared/schema";

// This file handles the interaction with Google Sheets API
// It uses free OAuth 2.0 flow to authenticate and access user's Google Sheets

// Function to create a new spreadsheet for attendance tracking
export async function createAttendanceSpreadsheet(accessToken: string, title: string): Promise<string | null> {
  try {
    // Create a new spreadsheet with the Google Sheets API
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Attendance',
              gridProperties: {
                rowCount: 1000,
                columnCount: 20,
              },
            },
          },
          {
            properties: {
              title: 'Students',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          },
          {
            properties: {
              title: 'Classes',
              gridProperties: {
                rowCount: 100,
                columnCount: 5,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
    }

    const data = await response.json();
    return data.spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
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

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${integration.sheetId}/values/Attendance:A1:append?valueInputOption=USER_ENTERED`, {
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
    email: string,
    contactPhone: string,
    address: string,
    classId: number,
  }>
): Promise<boolean> {
  try {
    const values = students.map(student => [
      student.studentId,
      student.name,
      student.email,
      student.contactPhone,
      student.address,
      String(student.classId)
    ]);

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${integration.sheetId}/values/Students:A1:append?valueInputOption=USER_ENTERED`, {
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

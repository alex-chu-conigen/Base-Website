import { QUICKBASE_CONFIG } from '../config/quickbase';


// Utility function to transform QuickBase response data
const transformQuickBaseData = (rawData) => {
    // Create a mapping of field IDs to their labels
    const fieldLabels = {};
    rawData.fields.forEach(field => {
        fieldLabels[field.id] = field.label;
    });

    return {
        data: rawData.data.map(item => {
            // Convert each data item into a plain object with string values
            const transformedItem = {};
            Object.entries(item).forEach(([key, value]) => {
                // Use the field label as the key instead of the field ID
                const label = fieldLabels[key] || key;
                transformedItem[label] = value?.value || value || '';
            });
            return transformedItem;
        }),
        metadata: {
            totalRecords: rawData.metadata?.totalRecords || 0,
            numRecords: rawData.metadata?.numRecords || 0
        }
    };
};

// Initialize user tokens with validation
const userTokens = QUICKBASE_CONFIG.userTokens;
if (!userTokens.user1 || !userTokens.user2 || !userTokens.user3) {
    console.error('One or more user tokens are not properly configured in environment variables');
}

let currentUserToken = userTokens.user1; // default user

export const quickbaseService = {
    setCurrentUser: (user) => {
        if (userTokens[user]) {
            currentUserToken = userTokens[user];
            return true;
        }
        console.error(`Invalid user: ${user}`);
        return false;
    },

    getCurrentUser: () => {
        return Object.keys(userTokens).find(key => userTokens[key] === currentUserToken) || 'user1';
    },

    async getReport() {
        try {
            if (!currentUserToken) {
                throw new Error('No user token available. Please check environment configuration.');
            }

            const queryParams = new URLSearchParams({
                tableId: QUICKBASE_CONFIG.tableId,
                skip: 0,
                top: 100
            });

            const headers = QUICKBASE_CONFIG.getHeaders(currentUserToken);
            
            const response = await fetch(
                `https://api.quickbase.com/v1/reports/32/run?${queryParams}`,
                {
                    method: 'POST',
                    headers
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            return transformQuickBaseData(rawData);
        } catch (error) {
            console.error('Error fetching report:', error);
            throw error;
        }
    },
    
    // Export the transform function so it can be used by other services if needed
    //transformQuickBaseData

    async getSummaryReport() {
        try {
            const queryParams = new URLSearchParams({
                tableId: 'buqb9vjqx'
            });

            const response = await fetch(
                `https://api.quickbase.com/v1/reports/49/run?${queryParams}`,
                {
                    method: 'POST',
                    headers: QUICKBASE_CONFIG.getHeaders(currentUserToken)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            return transformQuickBaseData(rawData);
        } catch (error) {
            console.error('Error fetching Quickbase report:', error);
            throw error;
        }
    },

    async getEntryDetails(recordId) {
        try {
            const response = await fetch(
                `https://api.quickbase.com/v1/records/query`,
                {
                    method: 'POST',
                    headers: QUICKBASE_CONFIG.getHeaders(currentUserToken),
                    body: JSON.stringify({
                        "from": "buqb9vjqx",
                        "select": [3, 25, 23, 75, 19],
                        "where": `{3.EX.${recordId}}`
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            return transformQuickBaseData(rawData);
        } catch (error) {
            console.error('Error fetching entry details:', error);
            throw error;
        }
    },

    async getAdditionalReport(name) {
        try {
            const response = await fetch(
                `https://api.quickbase.com/v1/records/query`,
                {
                    method: 'POST',
                    headers: QUICKBASE_CONFIG.getHeaders(currentUserToken),
                    body: JSON.stringify({
                        "from": "buqyn5x5h",
                        "select": [3, 11, 27, 6, 7, 8, 9],
                        "where": `{15.EX.${name}}`
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            return transformQuickBaseData(rawData);
        } catch (error) {
            console.error('Error fetching additional report:', error);
            throw error;
        }
    },

    async updateMeasurementValue(recordId, rowIndex, columnName, value) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    to: this.measurementTableId,
                    data: [{
                        id: recordId,
                        [columnName]: value
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update measurement value');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updating measurement value:', error);
            throw error;
        }
    }
};
export const QUICKBASE_CONFIG = {
    tableId: process.env.REACT_APP_QB_TABLE_ID,
    realm: process.env.REACT_APP_QB_REALM || 'conifer.quickbase.com',
    userTokens: {
        user1: process.env.REACT_APP_QUICKBASE_USER1_TOKEN,
        user2: process.env.REACT_APP_QUICKBASE_USER2_TOKEN,
        user3: process.env.REACT_APP_QUICKBASE_USER3_TOKEN
    },
    getHeaders: (userToken) => ({
        'QB-Realm-Hostname': process.env.REACT_APP_QB_REALM || 'conifer.quickbase.com',
        'Authorization': `QB-USER-TOKEN ${userToken}`,
        'QB-APP-TOKEN': process.env.REACT_APP_QB_APP_TOKEN,
        'Content-Type': 'application/json'
    })
}; 
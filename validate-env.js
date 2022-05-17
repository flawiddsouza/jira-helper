let missingEnvVars = []

if('JIRA_CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS' in process.env === false) {
    process.env.JIRA_CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS = ''
}

const requiredEnvs = [
    'JIRA_DOMAIN',
    'JIRA_USERNAME',
    'JIRA_ACCESS_TOKEN',
    'JIRA_CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS'
]

requiredEnvs.forEach(requiredEnv => {
    if(requiredEnv in process.env === false) {
        missingEnvVars.push(requiredEnv)
    }
})

if(missingEnvVars.length > 0) {
    console.error(`Please pass these env variables: ${missingEnvVars.join(', ')}`)
    process.exit()
}

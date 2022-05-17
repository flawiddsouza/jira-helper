import fetch from 'node-fetch'
import { confirm } from './helpers.js'

const DOMAIN = process.env.JIRA_DOMAIN
const USERNAME = process.env.JIRA_USERNAME
const ACCESS_TOKEN = process.env.JIRA_ACCESS_TOKEN
const API_URL = `${DOMAIN}/rest/api/3`
const CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS = process.env.JIRA_CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS.split(',')

const headers = {
    'Authorization': `Basic ${Buffer.from(`${USERNAME}:${ACCESS_TOKEN}`).toString('base64')}`,
    'Accept': 'application/json'
}

export async function getIssueDetails(issueId) {
    const response = await fetch(`${API_URL}/issue/${issueId}`, {
        headers: headers
    })
    if(response.status === 200) {
        return await response.json()
    } else {
        if(response.status === 404) {
            throw new Error('Invalid Issue Id Given')
        } else {
            console.log(response.status, response.statusText)
            return await response.text()
        }
    }
}

export function extractIssueDetails(issueDetails) {
    return {
        summary: issueDetails.fields.summary,
        description: issueDetails.fields.description,
        project: {
            id: issueDetails.fields.project.id
        },
        reporter: {
            id: issueDetails.fields.reporter.accountId
        },
        assignee: {
            id: issueDetails.fields.assignee.accountId
        },
        priority: {
            id: issueDetails.fields.priority.id
        },
        issuetype: {
            id: issueDetails.fields.issuetype.id
        },
        customFields: CUSTOM_FIELDS_FOR_EXTRACT_ISSUE_DETAILS.reduce((acc, customField) => {
            if(customField in issueDetails.fields) {
                acc[customField] = issueDetails.fields[customField]
                return acc
            } else {
                throw new Error(`Custom field "${customField}" defined in the env is not present in given issue details`)
            }
        }, {})
    }
}

export async function createIssue({ summary, description, project, reporter, assignee, priority, issuetype, customFields }) {
    const requestBody = {
        fields: {
            summary,
            description,
            project,
            reporter,
            assignee,
            priority,
            issuetype,
            ...customFields
        }
    }

    console.log(`Creating issue: ${summary}`)

    if(await confirm('Are you sure you want to continue?') === false) {
        process.exit()
    }

    const response = await fetch(`${API_URL}/issue`, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })

    if(response.status === 201) {
        const createdIssue = await response.json()
        return `Issue created: ${DOMAIN}/browse/${createdIssue.key}`
    } else {
        console.log(response.status, response.statusText)
        return await response.text()
    }
}

export async function cloneIssue(issueId) {
    try {
        const existingIssue = await getIssueDetails(issueId)
        const createdIssue = await createIssue(extractIssueDetails(existingIssue))
        return createdIssue
    } catch(e) {
        return e.message
    }
}

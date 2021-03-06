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

export async function cloneIssue(issueId, overrideFields) {
    try {
        const existingIssue = await getIssueDetails(issueId)
        const newIssueData = extractIssueDetails(existingIssue)
        if('description' in overrideFields && overrideFields.description) {
            newIssueData.description = convertPlainTextToAtlassianDocumentFormat(overrideFields.description)
        }
        const createdIssue = await createIssue(newIssueData)
        return createdIssue
    } catch(e) {
        return e.message
    }
}

export async function updateIssue(issueId, fieldsForUpdate) {
    const requestBody = {
        fields: fieldsForUpdate
    }

    // to check if issue exists - will stop executing here by throwing error if not
    await getIssueDetails(issueId)

    const response = await fetch(`${API_URL}/issue/${issueId}`, {
        method: 'PUT',
        headers: {
            ...headers,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })

    if(response.status === 204) {
        return `Issue updated: ${DOMAIN}/browse/${issueId}`
    } else {
        console.log(response.status, response.statusText)
        return await response.text()
    }
}

export function convertPlainTextToAtlassianDocumentFormat(text) {
    return {
        version: 1,
        type: 'doc',
        content: [
            {
                'type': 'paragraph',
                'content': [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            }
        ]
    }
}

export async function updateIssueDescription(issueId, description) {
    try {
        const updatedIssue = await updateIssue(issueId, {
            description: convertPlainTextToAtlassianDocumentFormat(description)
        })
        return updatedIssue
    } catch(e) {
        return e.message
    }
}

export async function deleteIssue(issueId) {
    try {
        // to check if issue exists - will stop executing here by throwing error if not
        const issueDetails = await getIssueDetails(issueId)

        console.log(`Deleting issue: ${issueDetails.fields.summary}`)

        if(await confirm('Are you sure you want to continue?') === false) {
            process.exit()
        }

        const response = await fetch(`${API_URL}/issue/${issueId}`, {
            method: 'DELETE',
            headers: {
                ...headers
            }
        })

        if(response.status === 204) {
            return `Issue deleted: ${DOMAIN}/browse/${issueId}`
        } else {
            console.log(response.status, response.statusText)
            return await response.text()
        }
    } catch(e) {
        return e.message
    }
}

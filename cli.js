#!/usr/bin/env node

import 'dotenv/config'
import './validate-env.js'
import { Command } from 'commander'
import { cloneIssue, updateIssueDescription, deleteIssue } from './api.js'

const program = new Command()

program
.name('jira-helper')
.description('CLI to speed up some jira tasks')
.version('1.0.0')

program
.command('clone-issue')
.description('Clone the given issue id')
.argument('<issueId>', 'issue id to clone')
.option('--description <char>', 'this will be set as the description for the new issue')
.action(async(issueId, option) => {
    if(option.description) {
        console.log(`Created issue description will be set to: ${option.description}`)
    }
    const createdIssue = await cloneIssue(issueId, {
        description: option.description
    })
    console.log(createdIssue)
})

program
.command('update-issue-description')
.description('Update issue description for given issue id')
.argument('<issueId>', 'issue id for description update')
.argument('<description>', 'description to update')
.action(async(issueId, description) => {
    const updatedIssue = await updateIssueDescription(issueId, description)
    console.log(updatedIssue)
})

program
.command('delete-issue')
.description('Delete the given issue id')
.argument('<issueId>', 'issue id to delete')
.action(async(issueId) => {
    const deletedIssue = await deleteIssue(issueId)
    console.log(deletedIssue)
})

program.parse()

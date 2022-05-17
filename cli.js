#!/usr/bin/env node

import 'dotenv/config'
import './validate-env.js'
import { Command } from 'commander'
import { cloneIssue } from './api.js'

const program = new Command()

program
.name('jira-helper')
.description('CLI to speed up some jira tasks')
.version('1.0.0')

program
.command('clone-issue')
.description('Clone the given issue id')
.argument('<issueId>', 'issue id to clone')
.action(async(issueId) => {
    const createdIssue = await cloneIssue(issueId)
    console.log(createdIssue)
})

program.parse()

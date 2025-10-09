#!/usr/bin/env node

/**
 * TODO Comment Audit Script
 * Implementation: Phase 2, Step 2.1
 * Date: October 8, 2025
 * 
 * This script systematically audits all TODO, FIXME, and HACK comments
 * in the codebase and generates structured feature tickets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  sourceDir: './src',
  outputDir: './docs/technical-debt',
  patterns: ['TODO', 'FIXME', 'HACK', 'XXX', 'BUG'],
  fileExtensions: ['.tsx', '.ts', '.js', '.jsx'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next'],
  ticketTemplate: {
    title: '',
    description: '',
    priority: 'Medium',
    complexity: 3,
    component: '',
    acceptanceCriteria: [],
    technicalNotes: '',
    labels: [],
    epic: 'Technical Debt',
    estimatedHours: 2
  }
};

// Priority and complexity scoring
const PRIORITY_RULES = {
  SECURITY: { priority: 'Critical', complexity: 8, hours: 8 },
  PERFORMANCE: { priority: 'High', complexity: 5, hours: 4 },
  BUG: { priority: 'High', complexity: 3, hours: 3 },
  HACK: { priority: 'Medium', complexity: 4, hours: 3 },
  TODO: { priority: 'Medium', complexity: 3, hours: 2 },
  FIXME: { priority: 'High', complexity: 4, hours: 3 },
  XXX: { priority: 'Low', complexity: 2, hours: 1 }
};

class TodoAuditor {
  constructor() {
    this.todos = [];
    this.ticketId = 1000;
    this.categories = {
      'Critical': [],
      'High': [],
      'Medium': [],
      'Low': []
    };
  }

  /**
   * Main audit process
   */
  async audit() {
    console.log('🔍 Starting TODO Comment Audit...\n');
    
    try {
      // Create output directory
      await this.ensureOutputDir();
      
      // Extract TODO comments using ripgrep for better performance
      await this.extractTodos();
      
      // Process and categorize todos
      await this.processTodos();
      
      // Generate tickets and reports
      await this.generateTickets();
      await this.generateSummaryReport();
      await this.generateCleanupScript();
      
      console.log(`\n✅ Audit Complete! Found ${this.todos.length} TODO comments`);
      console.log(`📊 Generated reports in: ${CONFIG.outputDir}`);
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  }

  /**
   * Extract TODO comments using ripgrep
   */
  async extractTodos() {
    console.log('📋 Extracting TODO comments...');
    
    const pattern = `(${CONFIG.patterns.join('|')})`;
    const extensions = CONFIG.fileExtensions.map(ext => `*${ext}`).join(',');
    const excludeDirs = CONFIG.excludeDirs.map(dir => `!${dir}/`).join(' ');
    
    try {
      // Use ripgrep for fast, accurate extraction
      const command = `npx rg "${pattern}" --type-add 'source:${extensions}' -t source --line-number --with-filename --no-heading ${CONFIG.sourceDir}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      const lines = output.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/^(.+?):(\d+):(.+)$/);
        if (match) {
          const [, filePath, lineNumber, content] = match;
          const todo = this.parseTodoComment(filePath, parseInt(lineNumber), content.trim());
          if (todo) {
            this.todos.push(todo);
          }
        }
      }
      
    } catch (error) {
      // Fallback to manual file scanning if ripgrep fails
      console.warn('⚠️ Ripgrep not available, using manual scanning...');
      await this.manualExtraction();
    }
    
    console.log(`   Found ${this.todos.length} TODO comments`);
  }

  /**
   * Fallback manual extraction method
   */
  async manualExtraction() {
    const files = await this.getAllSourceFiles(CONFIG.sourceDir);
    
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const todo = this.extractTodoFromLine(filePath, index + 1, line);
        if (todo) {
          this.todos.push(todo);
        }
      });
    }
  }

  /**
   * Get all source files recursively
   */
  async getAllSourceFiles(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !CONFIG.excludeDirs.includes(entry.name)) {
          scan(fullPath);
        } else if (entry.isFile() && CONFIG.fileExtensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    scan(dir);
    return files;
  }

  /**
   * Parse TODO comment and extract metadata
   */
  parseTodoComment(filePath, lineNumber, content) {
    const patterns = CONFIG.patterns.join('|');
    const regex = new RegExp(`(${patterns})\\s*:?\\s*(.*)`, 'i');
    const match = content.match(regex);
    
    if (!match) return null;
    
    const [, type, description] = match;
    const component = this.extractComponent(filePath);
    const context = this.extractContext(filePath, lineNumber);
    
    return {
      id: `TD-${++this.ticketId}`,
      type: type.toUpperCase(),
      description: description.replace(/\/\*|\*\/|\/\/|#/g, '').trim(),
      filePath: filePath.replace(process.cwd(), ''),
      lineNumber,
      component,
      context,
      ...this.scoreTask(type, description, filePath)
    };
  }

  /**
   * Extract TODO from a single line
   */
  extractTodoFromLine(filePath, lineNumber, line) {
    for (const pattern of CONFIG.patterns) {
      if (line.toLowerCase().includes(pattern.toLowerCase())) {
        return this.parseTodoComment(filePath, lineNumber, line);
      }
    }
    return null;
  }

  /**
   * Extract component name from file path
   */
  extractComponent(filePath) {
    const parts = filePath.split(path.sep);
    
    // Extract component from path patterns
    if (parts.includes('components')) {
      const componentIndex = parts.indexOf('components');
      return parts.slice(componentIndex + 1).join('/').replace(/\.(tsx?|jsx?)$/, '');
    }
    
    if (parts.includes('pages') || parts.includes('app')) {
      const pageIndex = parts.findIndex(p => p === 'pages' || p === 'app');
      return parts.slice(pageIndex + 1).join('/').replace(/\.(tsx?|jsx?)$/, '');
    }
    
    if (parts.includes('lib') || parts.includes('services')) {
      const libIndex = parts.findIndex(p => p === 'lib' || p === 'services');
      return parts.slice(libIndex + 1).join('/').replace(/\.(tsx?|jsx?)$/, '');
    }
    
    return parts[parts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Extract surrounding code context
   */
  extractContext(filePath, lineNumber) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const start = Math.max(0, lineNumber - 3);
      const end = Math.min(lines.length, lineNumber + 2);
      
      return {
        before: lines.slice(start, lineNumber - 1),
        current: lines[lineNumber - 1],
        after: lines.slice(lineNumber, end)
      };
    } catch {
      return { before: [], current: '', after: [] };
    }
  }

  /**
   * Score and prioritize task
   */
  scoreTask(type, description, filePath) {
    let scoring = PRIORITY_RULES[type.toUpperCase()] || PRIORITY_RULES.TODO;
    
    // Adjust based on content analysis
    const lowerDesc = description.toLowerCase();
    const lowerPath = filePath.toLowerCase();
    
    // Security-related
    if (lowerDesc.includes('security') || lowerDesc.includes('auth') || 
        lowerDesc.includes('password') || lowerDesc.includes('token')) {
      scoring = { ...PRIORITY_RULES.SECURITY };
    }
    
    // Performance-related
    if (lowerDesc.includes('performance') || lowerDesc.includes('optimize') || 
        lowerDesc.includes('slow') || lowerDesc.includes('cache')) {
      scoring = { ...PRIORITY_RULES.PERFORMANCE };
    }
    
    // Critical files (database, authentication, payment)
    if (lowerPath.includes('auth') || lowerPath.includes('payment') || 
        lowerPath.includes('database') || lowerPath.includes('security')) {
      scoring.priority = 'High';
      scoring.complexity = Math.max(scoring.complexity, 5);
    }
    
    // Simple cleanup tasks
    if (lowerDesc.includes('cleanup') || lowerDesc.includes('remove') || 
        lowerDesc.includes('refactor') && lowerDesc.length < 50) {
      scoring.priority = 'Low';
      scoring.complexity = 2;
      scoring.hours = 1;
    }
    
    return {
      priority: scoring.priority,
      complexity: scoring.complexity,
      estimatedHours: scoring.hours,
      labels: this.generateLabels(type, description, filePath)
    };
  }

  /**
   * Generate labels for ticket categorization
   */
  generateLabels(type, description, filePath) {
    const labels = [type.toLowerCase(), 'technical-debt'];
    
    // Component-based labels
    if (filePath.includes('components')) labels.push('frontend');
    if (filePath.includes('lib') || filePath.includes('services')) labels.push('backend');
    if (filePath.includes('hooks')) labels.push('hooks');
    if (filePath.includes('utils')) labels.push('utilities');
    
    // Feature-based labels
    if (filePath.includes('menu')) labels.push('menu-management');
    if (filePath.includes('auth')) labels.push('authentication');
    if (filePath.includes('payment')) labels.push('payments');
    if (filePath.includes('inventory')) labels.push('inventory');
    
    // Content-based labels
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('test')) labels.push('testing');
    if (lowerDesc.includes('performance')) labels.push('performance');
    if (lowerDesc.includes('security')) labels.push('security');
    if (lowerDesc.includes('accessibility')) labels.push('accessibility');
    
    return [...new Set(labels)]; // Remove duplicates
  }

  /**
   * Process and categorize todos
   */
  async processTodos() {
    console.log('🗂️  Categorizing TODO comments...');
    
    // Sort by priority and complexity
    this.todos.sort((a, b) => {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return b.complexity - a.complexity;
    });
    
    // Categorize by priority
    for (const todo of this.todos) {
      this.categories[todo.priority].push(todo);
    }
    
    console.log('   Priority breakdown:');
    Object.entries(this.categories).forEach(([priority, items]) => {
      if (items.length > 0) {
        console.log(`     ${priority}: ${items.length} items`);
      }
    });
  }

  /**
   * Generate feature tickets
   */
  async generateTickets() {
    console.log('🎫 Generating feature tickets...');
    
    const tickets = this.todos.map(todo => this.createTicket(todo));
    
    // Write tickets to JSON file
    const ticketsPath = path.join(CONFIG.outputDir, 'feature-tickets.json');
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2));
    
    // Write tickets as Markdown files
    const ticketsDir = path.join(CONFIG.outputDir, 'tickets');
    if (!fs.existsSync(ticketsDir)) {
      fs.mkdirSync(ticketsDir, { recursive: true });
    }
    
    for (const ticket of tickets) {
      const ticketPath = path.join(ticketsDir, `${ticket.id}.md`);
      fs.writeFileSync(ticketPath, this.generateTicketMarkdown(ticket));
    }
    
    console.log(`   Generated ${tickets.length} tickets`);
  }

  /**
   * Create structured ticket from TODO
   */
  createTicket(todo) {
    const title = this.generateTicketTitle(todo);
    const acceptanceCriteria = this.generateAcceptanceCriteria(todo);
    
    return {
      id: todo.id,
      title,
      description: this.generateTicketDescription(todo),
      priority: todo.priority,
      complexity: todo.complexity,
      estimatedHours: todo.estimatedHours,
      component: todo.component,
      acceptanceCriteria,
      technicalNotes: this.generateTechnicalNotes(todo),
      labels: todo.labels,
      epic: 'Technical Debt Cleanup',
      source: {
        type: todo.type,
        originalComment: todo.description,
        filePath: todo.filePath,
        lineNumber: todo.lineNumber
      },
      createdAt: new Date().toISOString(),
      status: 'backlog'
    };
  }

  /**
   * Generate meaningful ticket title
   */
  generateTicketTitle(todo) {
    const component = todo.component.split('/').pop();
    const action = this.extractAction(todo.description);
    
    return `${action} in ${component} (${todo.type})`.replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract action verb from description
   */
  extractAction(description) {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('implement') || lowerDesc.includes('add')) return 'Implement feature';
    if (lowerDesc.includes('fix') || lowerDesc.includes('bug')) return 'Fix issue';
    if (lowerDesc.includes('refactor') || lowerDesc.includes('cleanup')) return 'Refactor code';
    if (lowerDesc.includes('optimize') || lowerDesc.includes('performance')) return 'Optimize performance';
    if (lowerDesc.includes('test') || lowerDesc.includes('testing')) return 'Add tests';
    if (lowerDesc.includes('document') || lowerDesc.includes('docs')) return 'Update documentation';
    if (lowerDesc.includes('remove') || lowerDesc.includes('delete')) return 'Remove deprecated code';
    if (lowerDesc.includes('update') || lowerDesc.includes('upgrade')) return 'Update implementation';
    
    return 'Complete task';
  }

  /**
   * Generate ticket description
   */
  generateTicketDescription(todo) {
    return `## Context

**Original Comment**: ${todo.description}

**Location**: \`${todo.filePath}:${todo.lineNumber}\`

**Component**: ${todo.component}

## Problem Statement

${todo.description}

## Code Context

\`\`\`typescript
${todo.context.before.join('\n')}
> ${todo.context.current}  // <-- TODO LINE
${todo.context.after.join('\n')}
\`\`\`

## Impact

Priority: ${todo.priority} | Complexity: ${todo.complexity}/10 | Estimated: ${todo.estimatedHours}h
`;
  }

  /**
   * Generate acceptance criteria
   */
  generateAcceptanceCriteria(todo) {
    const criteria = [
      `✅ TODO comment removed from \`${todo.filePath}:${todo.lineNumber}\``,
      `✅ Implementation meets the requirements described in the comment`
    ];

    // Add specific criteria based on todo type
    if (todo.type === 'BUG' || todo.type === 'FIXME') {
      criteria.push(`✅ Issue is resolved and tested`);
      criteria.push(`✅ No regressions introduced`);
    }

    if (todo.type === 'PERFORMANCE') {
      criteria.push(`✅ Performance improvement is measurable`);
      criteria.push(`✅ Benchmarks confirm optimization`);
    }

    if (todo.description.includes('test')) {
      criteria.push(`✅ Test coverage added`);
      criteria.push(`✅ All tests pass`);
    }

    return criteria;
  }

  /**
   * Generate technical notes
   */
  generateTechnicalNotes(todo) {
    return `## Technical Implementation Notes

- **File**: \`${todo.filePath}\`
- **Line**: ${todo.lineNumber}
- **Type**: ${todo.type}
- **Component**: ${todo.component}

## Considerations

- Review surrounding code for related changes
- Consider impact on other components
- Add appropriate tests
- Update documentation if needed

## Definition of Done

- [ ] Code changes implemented
- [ ] Tests added/updated
- [ ] Code review passed
- [ ] Documentation updated (if applicable)
- [ ] TODO comment removed
`;
  }

  /**
   * Generate ticket as Markdown
   */
  generateTicketMarkdown(ticket) {
    return `# ${ticket.title}

**ID**: ${ticket.id}  
**Priority**: ${ticket.priority}  
**Complexity**: ${ticket.complexity}/10  
**Estimated**: ${ticket.estimatedHours}h  
**Component**: ${ticket.component}  
**Labels**: ${ticket.labels.join(', ')}  

---

${ticket.description}

## Acceptance Criteria

${ticket.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

${ticket.technicalNotes}

---

**Source**: \`${ticket.source.filePath}:${ticket.source.lineNumber}\`  
**Created**: ${ticket.createdAt}  
**Status**: ${ticket.status}  
`;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    console.log('📊 Generating summary report...');
    
    const report = {
      auditDate: new Date().toISOString(),
      totalTodos: this.todos.length,
      breakdown: {
        byPriority: {},
        byType: {},
        byComponent: {},
        byEstimatedHours: 0
      },
      recommendations: []
    };
    
    // Calculate breakdowns
    this.todos.forEach(todo => {
      // By priority
      report.breakdown.byPriority[todo.priority] = 
        (report.breakdown.byPriority[todo.priority] || 0) + 1;
      
      // By type
      report.breakdown.byType[todo.type] = 
        (report.breakdown.byType[todo.type] || 0) + 1;
      
      // By component
      const component = todo.component.split('/')[0];
      report.breakdown.byComponent[component] = 
        (report.breakdown.byComponent[component] || 0) + 1;
      
      // Total hours
      report.breakdown.byEstimatedHours += todo.estimatedHours;
    });
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations();
    
    // Write report
    const reportPath = path.join(CONFIG.outputDir, 'audit-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Write markdown report
    const markdownReport = this.generateMarkdownSummary(report);
    const markdownPath = path.join(CONFIG.outputDir, 'AUDIT-SUMMARY.md');
    fs.writeFileSync(markdownPath, markdownReport);
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Critical items recommendation
    const criticalCount = this.categories.Critical.length;
    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical items immediately - these may be security or stability risks`);
    }
    
    // High priority items
    const highCount = this.categories.High.length;
    if (highCount > 5) {
      recommendations.push(`Plan sprint dedicated to high-priority items (${highCount} items)`);
    }
    
    // Component with most issues
    const componentCounts = {};
    this.todos.forEach(todo => {
      const component = todo.component.split('/')[0];
      componentCounts[component] = (componentCounts[component] || 0) + 1;
    });
    
    const topComponent = Object.entries(componentCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topComponent && topComponent[1] > 3) {
      recommendations.push(`Focus on cleaning up ${topComponent[0]} component (${topComponent[1]} items)`);
    }
    
    // Total effort estimation
    const totalHours = this.todos.reduce((sum, todo) => sum + todo.estimatedHours, 0);
    const sprints = Math.ceil(totalHours / 40); // Assuming 40 hours per sprint
    
    recommendations.push(`Estimated effort: ${totalHours} hours (${sprints} sprints)`);
    
    return recommendations;
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(report) {
    return `# Technical Debt Audit Summary

**Audit Date**: ${new Date(report.auditDate).toLocaleDateString()}  
**Total Items**: ${report.totalTodos}  
**Estimated Effort**: ${report.breakdown.byEstimatedHours} hours  

## Priority Breakdown

${Object.entries(report.breakdown.byPriority)
  .sort(([,a], [,b]) => b - a)
  .map(([priority, count]) => `- **${priority}**: ${count} items`)
  .join('\n')}

## Type Breakdown

${Object.entries(report.breakdown.byType)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `- **${type}**: ${count} items`)
  .join('\n')}

## Component Breakdown

${Object.entries(report.breakdown.byComponent)
  .sort(([,a], [,b]) => b - a)
  .map(([component, count]) => `- **${component}**: ${count} items`)
  .join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. **Immediate**: Address all Critical priority items
2. **Sprint 1**: Focus on High priority items
3. **Sprint 2-3**: Medium priority items by component
4. **Ongoing**: Low priority items during regular development

## Files Generated

- \`feature-tickets.json\` - All tickets in JSON format
- \`tickets/\` - Individual ticket files
- \`cleanup-script.js\` - Automated cleanup script

---

*Generated by TODO Audit Script v1.0*
`;
  }

  /**
   * Generate cleanup script
   */
  async generateCleanupScript() {
    console.log('🧹 Generating cleanup script...');
    
    const script = `#!/usr/bin/env node

/**
 * Automated TODO Cleanup Script
 * Generated: ${new Date().toISOString()}
 * 
 * This script removes TODO comments that have been converted to tickets.
 * Run after tickets have been created and assigned.
 */

const fs = require('fs');

const todosToRemove = ${JSON.stringify(this.todos.map(todo => ({
  filePath: todo.filePath,
  lineNumber: todo.lineNumber,
  ticketId: todo.id,
  originalComment: todo.description
})), null, 2)};

function removeCompletedTodos() {
  console.log('🧹 Starting TODO cleanup...');
  
  let removedCount = 0;
  
  for (const todo of todosToRemove) {
    try {
      const filePath = '.' + todo.filePath;
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\\n');
      
      // Check if the TODO still exists at the specified line
      const targetLine = lines[todo.lineNumber - 1];
      if (targetLine && targetLine.includes(todo.originalComment.substring(0, 30))) {
        // Replace TODO with ticket reference
        const ticketComment = targetLine.replace(
          /(TODO|FIXME|HACK|XXX)\\s*:?\\s*(.*)/, 
          \`// Ticket: \${todo.ticketId} - $2\`
        );
        
        lines[todo.lineNumber - 1] = ticketComment;
        fs.writeFileSync(filePath, lines.join('\\n'));
        removedCount++;
        
        console.log(\`   ✅ \${todo.filePath}:\${todo.lineNumber} -> \${todo.ticketId}\`);
      }
    } catch (error) {
      console.warn(\`   ⚠️  Could not process \${todo.filePath}: \${error.message}\`);
    }
  }
  
  console.log(\`\\n✅ Cleanup complete! Processed \${removedCount} TODO comments\`);
  console.log('📋 TODO comments have been replaced with ticket references');
  console.log('🎫 Review generated tickets in ./docs/technical-debt/tickets/');
}

if (require.main === module) {
  removeCompletedTodos();
}

module.exports = { removeCompletedTodos };
`;
    
    const scriptPath = path.join(CONFIG.outputDir, 'cleanup-script.js');
    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new TodoAuditor();
  auditor.audit().catch(console.error);
}

module.exports = { TodoAuditor, CONFIG };

#!/usr/bin/env node

/**
 * Performance Report Script for Local Testing
 * Generates a comprehensive performance report for the application
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Performance thresholds
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  TTI: { good: 3800, poor: 7300 },
  bundleSize: { good: 500000, poor: 1000000 }, // 500KB good, 1MB poor
  buildTime: { good: 30000, poor: 60000 } // 30s good, 60s poor
}

class PerformanceReporter {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      metrics: {},
      buildMetrics: {},
      bundleAnalysis: {},
      recommendations: [],
      score: 0
    }
  }

  /**
   * Print colored console output
   */
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
  }

  /**
   * Print section header
   */
  printHeader(title) {
    this.log('\n' + '='.repeat(60), 'cyan')
    this.log(`  ${title}`, 'bright')
    this.log('='.repeat(60), 'cyan')
  }

  /**
   * Get rating color based on value and thresholds
   */
  getRatingColor(value, thresholds) {
    if (value <= thresholds.good) return 'green'
    if (value <= thresholds.poor) return 'yellow'
    return 'red'
  }

  /**
   * Get rating text based on value and thresholds
   */
  getRating(value, thresholds) {
    if (value <= thresholds.good) return 'GOOD'
    if (value <= thresholds.poor) return 'NEEDS IMPROVEMENT'
    return 'POOR'
  }

  /**
   * Analyze bundle size
   */
  analyzeBundleSize() {
    this.printHeader('Bundle Size Analysis')
    
    try {
      // Check if .next directory exists
      const nextDir = path.join(process.cwd(), '.next')
      if (!fs.existsSync(nextDir)) {
        this.log('❌ No build found. Run "npm run build" first.', 'red')
        return
      }

      // Analyze static chunks
      const staticDir = path.join(nextDir, 'static', 'chunks')
      if (fs.existsSync(staticDir)) {
        const chunks = fs.readdirSync(staticDir)
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(staticDir, file)
            const stats = fs.statSync(filePath)
            return {
              name: file,
              size: stats.size,
              sizeKB: Math.round(stats.size / 1024)
            }
          })
          .sort((a, b) => b.size - a.size)

        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
        const totalSizeKB = Math.round(totalSize / 1024)

        this.report.bundleAnalysis = {
          totalSize,
          totalSizeKB,
          chunks: chunks.slice(0, 10) // Top 10 largest chunks
        }

        this.log(`📦 Total Bundle Size: ${totalSizeKB} KB`, this.getRatingColor(totalSize, THRESHOLDS.bundleSize))
        this.log(`📊 Rating: ${this.getRating(totalSize, THRESHOLDS.bundleSize)}`)
        
        this.log('\n🔍 Largest Chunks:')
        chunks.slice(0, 5).forEach((chunk, index) => {
          this.log(`  ${index + 1}. ${chunk.name}: ${chunk.sizeKB} KB`)
        })

        // Add recommendations based on bundle size
        if (totalSize > THRESHOLDS.bundleSize.poor) {
          this.report.recommendations.push('Bundle size is too large. Consider code splitting and removing unused dependencies.')
        } else if (totalSize > THRESHOLDS.bundleSize.good) {
          this.report.recommendations.push('Bundle size could be optimized. Review large chunks and implement dynamic imports.')
        }
      }
    } catch (error) {
      this.log(`❌ Bundle analysis failed: ${error.message}`, 'red')
    }
  }

  /**
   * Analyze build performance
   */
  analyzeBuildPerformance() {
    this.printHeader('Build Performance Analysis')
    
    try {
      this.log('🔨 Running production build...', 'yellow')
      const startTime = Date.now()
      
      // Run build command and capture output
      const buildOutput = execSync('npm run build', { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      const buildTime = Date.now() - startTime
      const buildTimeSeconds = Math.round(buildTime / 1000)

      this.report.buildMetrics = {
        buildTime,
        buildTimeSeconds,
        success: true
      }

      this.log(`⏱️  Build Time: ${buildTimeSeconds}s`, this.getRatingColor(buildTime, THRESHOLDS.buildTime))
      this.log(`📊 Rating: ${this.getRating(buildTime, THRESHOLDS.buildTime)}`)

      // Parse build output for additional metrics
      if (buildOutput.includes('Route (app)')) {
        this.log('\n📄 Route Analysis:')
        const routeLines = buildOutput.split('\n').filter(line => line.includes('Route (app)'))
        routeLines.slice(0, 5).forEach(line => {
          this.log(`  ${line.trim()}`)
        })
      }

      // Add recommendations based on build time
      if (buildTime > THRESHOLDS.buildTime.poor) {
        this.report.recommendations.push('Build time is too slow. Consider optimizing dependencies and build configuration.')
      } else if (buildTime > THRESHOLDS.buildTime.good) {
        this.report.recommendations.push('Build time could be improved. Review build process and consider caching strategies.')
      }

    } catch (error) {
      this.log(`❌ Build failed: ${error.message}`, 'red')
      this.report.buildMetrics = {
        buildTime: 0,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Analyze dependencies
   */
  analyzeDependencies() {
    this.printHeader('Dependency Analysis')
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      const dependencies = Object.keys(packageJson.dependencies || {})
      const devDependencies = Object.keys(packageJson.devDependencies || {})
      
      this.log(`📦 Production Dependencies: ${dependencies.length}`)
      this.log(`🔧 Development Dependencies: ${devDependencies.length}`)
      
      // Check for potentially heavy dependencies
      const heavyDeps = dependencies.filter(dep => 
        ['lodash', 'moment', 'rxjs', 'three', 'chart.js'].includes(dep)
      )
      
      if (heavyDeps.length > 0) {
        this.log('\n⚠️  Heavy Dependencies Detected:', 'yellow')
        heavyDeps.forEach(dep => {
          this.log(`  - ${dep}`)
        })
        this.report.recommendations.push('Consider lighter alternatives for heavy dependencies or use dynamic imports.')
      }

      // Check for duplicate functionality
      const uiLibs = dependencies.filter(dep => 
        dep.includes('ui') || dep.includes('component') || dep.includes('react-')
      )
      
      if (uiLibs.length > 5) {
        this.log('\n📚 Multiple UI Libraries:', 'yellow')
        uiLibs.forEach(lib => {
          this.log(`  - ${lib}`)
        })
        this.report.recommendations.push('Multiple UI libraries detected. Consider consolidating to reduce bundle size.')
      }

    } catch (error) {
      this.log(`❌ Dependency analysis failed: ${error.message}`, 'red')
    }
  }

  /**
   * Check performance configuration
   */
  checkPerformanceConfig() {
    this.printHeader('Performance Configuration Check')
    
    const checks = [
      {
        name: 'Next.js Image Optimization',
        check: () => {
          const configPath = path.join(process.cwd(), 'next.config.mjs')
          if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8')
            return !config.includes('unoptimized: true')
          }
          return false
        }
      },
      {
        name: 'SWC Minification',
        check: () => {
          const configPath = path.join(process.cwd(), 'next.config.mjs')
          if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8')
            return config.includes('swcMinify: true') || !config.includes('swcMinify: false')
          }
          return true // Default is true in Next.js 13+
        }
      },
      {
        name: 'Compression Enabled',
        check: () => {
          const configPath = path.join(process.cwd(), 'next.config.mjs')
          if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8')
            return config.includes('compress: true') || !config.includes('compress: false')
          }
          return true // Default is true
        }
      },
      {
        name: 'Performance Monitoring',
        check: () => {
          const perfPath = path.join(process.cwd(), 'lib', 'performance.ts')
          return fs.existsSync(perfPath)
        }
      },
      {
        name: 'Bundle Analyzer Available',
        check: () => {
          const packageJsonPath = path.join(process.cwd(), 'package.json')
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
          return packageJson.devDependencies && '@next/bundle-analyzer' in packageJson.devDependencies
        }
      }
    ]

    checks.forEach(({ name, check }) => {
      const passed = check()
      const icon = passed ? '✅' : '❌'
      const color = passed ? 'green' : 'red'
      this.log(`${icon} ${name}`, color)
      
      if (!passed) {
        this.report.recommendations.push(`Enable ${name} for better performance.`)
      }
    })
  }

  /**
   * Generate Lighthouse-style score
   */
  calculateScore() {
    let score = 100
    const { bundleAnalysis, buildMetrics } = this.report

    // Deduct points for bundle size
    if (bundleAnalysis.totalSize) {
      if (bundleAnalysis.totalSize > THRESHOLDS.bundleSize.poor) {
        score -= 30
      } else if (bundleAnalysis.totalSize > THRESHOLDS.bundleSize.good) {
        score -= 15
      }
    }

    // Deduct points for build time
    if (buildMetrics.buildTime) {
      if (buildMetrics.buildTime > THRESHOLDS.buildTime.poor) {
        score -= 20
      } else if (buildMetrics.buildTime > THRESHOLDS.buildTime.good) {
        score -= 10
      }
    }

    // Deduct points for recommendations
    score -= Math.min(this.report.recommendations.length * 5, 30)

    this.report.score = Math.max(score, 0)
    return this.report.score
  }

  /**
   * Print final summary
   */
  printSummary() {
    this.printHeader('Performance Summary')
    
    const score = this.calculateScore()
    let scoreColor = 'green'
    if (score < 50) scoreColor = 'red'
    else if (score < 80) scoreColor = 'yellow'

    this.log(`🎯 Overall Performance Score: ${score}/100`, scoreColor)
    
    if (this.report.recommendations.length > 0) {
      this.log('\n💡 Recommendations:', 'yellow')
      this.report.recommendations.forEach((rec, index) => {
        this.log(`  ${index + 1}. ${rec}`)
      })
    } else {
      this.log('\n🎉 No performance issues detected!', 'green')
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'performance-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2))
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue')
  }

  /**
   * Run complete performance analysis
   */
  async run() {
    this.log('🚀 Starting Performance Analysis...', 'bright')
    
    this.checkPerformanceConfig()
    this.analyzeDependencies()
    this.analyzeBuildPerformance()
    this.analyzeBundleSize()
    this.printSummary()
    
    this.log('\n✨ Performance analysis complete!', 'green')
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const reporter = new PerformanceReporter()

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Performance Report Script

Usage: node scripts/performance-report.js [options]

Options:
  --help, -h     Show this help message
  --build-only   Only run build performance analysis
  --bundle-only  Only run bundle size analysis
  --config-only  Only check performance configuration

Examples:
  node scripts/performance-report.js
  node scripts/performance-report.js --build-only
  npm run test:performance
`)
    process.exit(0)
  }

  // Handle specific analysis types
  if (args.includes('--build-only')) {
    reporter.analyzeBuildPerformance()
  } else if (args.includes('--bundle-only')) {
    reporter.analyzeBundleSize()
  } else if (args.includes('--config-only')) {
    reporter.checkPerformanceConfig()
  } else {
    // Run full analysis
    reporter.run().catch(error => {
      console.error('❌ Performance analysis failed:', error.message)
      process.exit(1)
    })
  }
}

module.exports = PerformanceReporter
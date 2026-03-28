import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generatePlayerPaymentRef } from '../lib/generate-player-payment-ref'

const prisma = new PrismaClient()

async function main() {
  console.log('🏀 Seeding HoopsLedger database...')

  // Create super admin
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin123!', 10)
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'superadmin@hoopsledger.com' },
    update: {
      passwordHash: superAdminPasswordHash,
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@hoopsledger.com',
      passwordHash: superAdminPasswordHash,
    },
  })

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-hoops' },
    update: {},
    create: {
      name: 'Demo Hoops Club',
      slug: 'demo-hoops',
      timezone: 'Europe/London',
      currency: 'GBP',
      brandingJson: {
        primaryColor: '#F97316',
        logoUrl: null,
        customName: 'Demo Hoops Club'
      },
    },
  })

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demohoops.com' },
    update: {},
    create: {
      orgId: org.id,
      name: 'Admin User',
      email: 'admin@demohoops.com',
      role: 'admin',
      passwordHash,
    },
  })

  // Create supervisor user
  const supervisorPasswordHash = await bcrypt.hash('supervisor123', 10)
  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@demohoops.com' },
    update: {},
    create: {
      orgId: org.id,
      name: 'Supervisor User',
      email: 'supervisor@demohoops.com',
      role: 'supervisor',
      passwordHash: supervisorPasswordHash,
    },
  })

  // Create pricing categories
  const standardPricing = await prisma.pricingRule.upsert({
    where: { id: 'demo-standard-pricing' },
    update: {},
    create: {
      id: 'demo-standard-pricing',
      orgId: org.id,
      name: 'Standard',
      feePence: 500, // £5.00
    },
  })

  const studentPricing = await prisma.pricingRule.upsert({
    where: { id: 'demo-student-pricing' },
    update: {},
    create: {
      id: 'demo-student-pricing',
      orgId: org.id,
      name: 'Student',
      feePence: 300, // £3.00
    },
  })

  const guestPricing = await prisma.pricingRule.upsert({
    where: { id: 'demo-guest-pricing' },
    update: {},
    create: {
      id: 'demo-guest-pricing',
      orgId: org.id,
      name: 'Guest',
      feePence: 0, // £0.00
    },
  })

  const juniorPricing = await prisma.pricingRule.upsert({
    where: { id: 'demo-junior-pricing' },
    update: {},
    create: {
      id: 'demo-junior-pricing',
      orgId: org.id,
      name: 'U17',
      feePence: 250, // £2.50
    },
  })

  // Create demo players
  const players = await Promise.all([
    prisma.player.upsert({
      where: { email: 'john.student@email.com' },
      update: {},
      create: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'John Student',
        email: 'john.student@email.com',
        phone: '+44 7700 900123',
        pricingRuleId: studentPricing.id,
        isExempt: false,
        isActive: true,
      },
    }),
    prisma.player.create({
      data: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'Jane Standard',
        email: 'jane.standard@email.com',
        phone: '+44 7700 900124',
        pricingRuleId: standardPricing.id,
        isExempt: false,
        isActive: true,
      },
    }),
    prisma.player.create({
      data: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'Mike Exempt',
        email: 'mike.exempt@email.com',
        pricingRuleId: standardPricing.id,
        isExempt: true,
        isActive: true,
      },
    }),
    prisma.player.create({
      data: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'Guest Player',
        // No email - cannot log in
        pricingRuleId: guestPricing.id,
        isExempt: false,
        isActive: true,
      },
    }),
    prisma.player.create({
      data: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'Sarah Standard',
        email: 'sarah.standard@email.com',
        pricingRuleId: standardPricing.id,
        isExempt: false,
        isActive: true,
      },
    }),
    prisma.player.create({
      data: {
        orgId: org.id,
        paymentRef: generatePlayerPaymentRef(),
        name: 'Tommy Junior',
        email: 'tommy.junior@email.com',
        phone: '+44 7700 900125',
        pricingRuleId: juniorPricing.id,
        isExempt: false,
        isActive: true,
      },
    }),
  ])

  // Create demo sessions
  const now = new Date()
  const todaySession = await prisma.session.create({
    data: {
      orgId: org.id,
      name: "Today's Training",
      venue: 'Main Court',
      startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0), // 6 PM today
      endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0),   // 8 PM today
      notes: 'Bring water bottles',
    },
  })

  const tomorrowSession = await prisma.session.create({
    data: {
      orgId: org.id,
      name: 'Skills Development',
      venue: 'Training Hall',
      startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0), // 7 PM tomorrow
      endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 21, 0),   // 9 PM tomorrow
    },
  })

  // Create sample attendance records for today's session
  await Promise.all([
    prisma.attendance.create({
      data: {
        sessionId: todaySession.id,
        playerId: players[0].id, // John Student (£3.00)
        checkedInAt: new Date(),
        checkedInByUser: adminUser.id,
        feeAppliedPence: 300,
        status: 'paid',
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: todaySession.id,
        playerId: players[1].id, // Jane Standard (£5.00)
        checkedInAt: new Date(),
        checkedInByUser: adminUser.id,
        feeAppliedPence: 500,
        status: 'unpaid',
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: todaySession.id,
        playerId: players[2].id, // Mike Exempt (£0.00)
        checkedInAt: new Date(),
        checkedInByUser: adminUser.id,
        feeAppliedPence: 0,
        status: 'exempt',
      },
    }),
    prisma.attendance.create({
      data: {
        sessionId: todaySession.id,
        playerId: players[5].id, // Tommy Junior (£2.50)
        checkedInAt: new Date(),
        checkedInByUser: adminUser.id,
        feeAppliedPence: 250,
        status: 'paid',
      },
    }),
  ])

  // Create corresponding payments for paid attendance
  await Promise.all([
    prisma.payment.create({
      data: {
        orgId: org.id,
        sessionId: todaySession.id,
        playerId: players[0].id, // John Student
        amountPence: 300,
        method: 'cash',
        occurredOn: new Date(),
        recordedBy: adminUser.id,
        notes: 'Student rate - cash payment',
      },
    }),
    prisma.payment.create({
      data: {
        orgId: org.id,
        sessionId: todaySession.id,
        playerId: players[5].id, // Tommy Junior
        amountPence: 250,
        method: 'cash',
        occurredOn: new Date(),
        recordedBy: adminUser.id,
        notes: 'U17 rate - cash payment',
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log('\n🔐 SUPER ADMIN LOGIN:')
  console.log(`   Email: ${superAdmin.email}`)
  console.log(`   Password: SuperAdmin123!`)
  console.log(`   URL: /super-admin/login`)
  console.log('\n📧 DEMO ORG ADMIN LOGIN:')
  console.log(`   Email: admin@demohoops.com`)
  console.log(`   Password: admin123`)
  console.log('👤 Supervisor login: supervisor@demohoops.com / supervisor123')
  console.log(`🏟️  Organization: ${org.name} (${org.slug})`)
  console.log(`👥 Created ${players.length} demo players with different pricing categories`)
  console.log(`💰 Created 4 pricing categories: Standard (£5.00), Student (£3.00), Guest (£0.00), U17 (£2.50)`)
  console.log(`📅 Created 2 demo sessions with sample attendance data`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
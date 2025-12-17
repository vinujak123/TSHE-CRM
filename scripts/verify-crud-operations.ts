import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCRUDOperations() {
  console.log('🔍 Verifying CRUD operations for all sections...\n')

  try {
    // 1. Verify Programs CRUD
    console.log('📚 Testing Programs CRUD...')
    const testProgram = await prisma.program.create({
      data: {
        name: 'Test Program',
        level: 'Test Level',
        campus: 'Test Campus',
        nextIntakeDate: new Date()
      }
    })
    console.log('✅ Program created:', testProgram.name)

    const updatedProgram = await prisma.program.update({
      where: { id: testProgram.id },
      data: { name: 'Updated Test Program' }
    })
    console.log('✅ Program updated:', updatedProgram.name)

    await prisma.program.delete({ where: { id: testProgram.id } })
    console.log('✅ Program deleted')

    // 2. Verify Levels CRUD
    console.log('\n📊 Testing Levels CRUD...')
    const testLevel = await prisma.level.create({
      data: {
        name: 'Test Level',
        description: 'Test level description',
        sortOrder: 1
      }
    })
    console.log('✅ Level created:', testLevel.name)

    const updatedLevel = await prisma.level.update({
      where: { id: testLevel.id },
      data: { name: 'Updated Test Level' }
    })
    console.log('✅ Level updated:', updatedLevel.name)

    await prisma.level.delete({ where: { id: testLevel.id } })
    console.log('✅ Level deleted')

    // 3. Verify Campaign Types CRUD
    console.log('\n🎯 Testing Campaign Types CRUD...')
    const testCampaignType = await prisma.campaignType.create({
      data: {
        name: 'TEST_CAMPAIGN',
        description: 'Test campaign type',
        color: '#FF0000',
        icon: '🧪',
        isActive: true,
        isDefault: false
      }
    })
    console.log('✅ Campaign Type created:', testCampaignType.name)

    const updatedCampaignType = await prisma.campaignType.update({
      where: { id: testCampaignType.id },
      data: { name: 'UPDATED_TEST_CAMPAIGN' }
    })
    console.log('✅ Campaign Type updated:', updatedCampaignType.name)

    await prisma.campaignType.delete({ where: { id: testCampaignType.id } })
    console.log('✅ Campaign Type deleted')

    // 4. Verify Campaigns CRUD
    console.log('\n📢 Testing Campaigns CRUD...')
    const testCampaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign',
        description: 'Test campaign description',
        type: 'EMAIL',
        targetAudience: 'Students',
        startDate: new Date(),
        status: 'DRAFT'
      }
    })
    console.log('✅ Campaign created:', testCampaign.name)

    const updatedCampaign = await prisma.campaign.update({
      where: { id: testCampaign.id },
      data: { name: 'Updated Test Campaign' }
    })
    console.log('✅ Campaign updated:', updatedCampaign.name)

    await prisma.campaign.delete({ where: { id: testCampaign.id } })
    console.log('✅ Campaign deleted')

    // 5. Verify Seekers (Inquiries) CRUD
    console.log('\n👥 Testing Seekers (Inquiries) CRUD...')
    const testSeeker = await prisma.seeker.create({
      data: {
        fullName: 'Test Seeker',
        phone: '1234567890',
        email: 'test@example.com',
        city: 'Test City',
        marketingSource: 'EMAIL',
        whatsapp: true,
        consent: true
      }
    })
    console.log('✅ Seeker created:', testSeeker.fullName)

    const updatedSeeker = await prisma.seeker.update({
      where: { id: testSeeker.id },
      data: { fullName: 'Updated Test Seeker' }
    })
    console.log('✅ Seeker updated:', updatedSeeker.fullName)

    await prisma.seeker.delete({ where: { id: testSeeker.id } })
    console.log('✅ Seeker deleted')

    // 6. Verify Users CRUD
    console.log('\n👤 Testing Users CRUD...')
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    })
    console.log('✅ User created:', testUser.name)

    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Updated Test User' }
    })
    console.log('✅ User updated:', updatedUser.name)

    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ User deleted')

    // 7. Verify Roles CRUD
    console.log('\n🔐 Testing Roles CRUD...')
    const testRole = await prisma.role.create({
      data: {
        name: 'Test Role',
        description: 'Test role description'
      }
    })
    console.log('✅ Role created:', testRole.name)

    const updatedRole = await prisma.role.update({
      where: { id: testRole.id },
      data: { name: 'Updated Test Role' }
    })
    console.log('✅ Role updated:', updatedRole.name)

    await prisma.role.delete({ where: { id: testRole.id } })
    console.log('✅ Role deleted')

    // 8. Verify Permissions CRUD
    console.log('\n🛡️ Testing Permissions CRUD...')
    const testPermission = await prisma.permissionModel.create({
      data: {
        name: 'CREATE_USER',
        description: 'Test permission description'
      }
    })
    console.log('✅ Permission created:', testPermission.name)

    const updatedPermission = await prisma.permissionModel.update({
      where: { id: testPermission.id },
      data: { name: 'READ_USER' }
    })
    console.log('✅ Permission updated:', updatedPermission.name)

    await prisma.permissionModel.delete({ where: { id: testPermission.id } })
    console.log('✅ Permission deleted')

    console.log('\n🎉 All CRUD operations verified successfully!')
    console.log('\n📋 Summary of verified sections:')
    console.log('  ✅ Programs - Create, Read, Update, Delete')
    console.log('  ✅ Levels - Create, Read, Update, Delete')
    console.log('  ✅ Campaign Types - Create, Read, Update, Delete')
    console.log('  ✅ Campaigns - Create, Read, Update, Delete')
    console.log('  ✅ Seekers (Inquiries) - Create, Read, Update, Delete')
    console.log('  ✅ Users - Create, Read, Update, Delete')
    console.log('  ✅ Roles - Create, Read, Update, Delete')
    console.log('  ✅ Permissions - Create, Read, Update, Delete')

  } catch (error) {
    console.error('❌ Error during CRUD verification:', error)
    throw error
  }
}

async function main() {
  try {
    await verifyCRUDOperations()
  } catch (error) {
    console.error('❌ CRUD verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

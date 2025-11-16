const fs = require('fs').promises;
const path = require('path');

async function migrateDeclinedToParked() {
  console.log('🔄 Starting migration: declined → parked');
  
  const dataDir = path.join(__dirname, 'data', 'ideas');
  
  try {
    // Read all idea files
    const files = await fs.readdir(dataDir);
    const ideaFiles = files.filter(file => file.startsWith('idea-') && file.endsWith('.json'));
    
    console.log(`📁 Found ${ideaFiles.length} idea files`);
    
    let updatedCount = 0;
    
    for (const file of ideaFiles) {
      const filepath = path.join(dataDir, file);
      const data = await fs.readFile(filepath, 'utf8');
      const idea = JSON.parse(data);
      
      // Check if status is 'declined'
      if (idea.status === 'declined') {
        console.log(`  ✏️  Updating idea ${idea.id}: "${idea.title}" - declined → parked`);
        idea.status = 'parked';
        idea.updatedAt = new Date().toISOString();
        
        // Save updated idea
        await fs.writeFile(filepath, JSON.stringify(idea, null, 2));
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated ${updatedCount} ideas from 'declined' to 'parked'`);
    console.log(`   ${ideaFiles.length - updatedCount} ideas were already using other statuses`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateDeclinedToParked();

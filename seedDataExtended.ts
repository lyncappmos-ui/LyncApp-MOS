
import { MOSService } from './src/services/mosService';
import { SACCO, Branch, CrewMember, Vehicle } from './src/types';

/**
 * LyncApp MOS Core - Extended Seed Script
 * Populates realistic mobility data for testing and development.
 */

const firstNames = ["John", "Peter", "Alice", "Mary", "James", "Patrick", "Grace", "Mercy", "Kevin", "Sarah", "Francis", "David", "Lucy", "Emily", "Brian", "Victor", "Naomi", "Rose", "Dan", "Sam"];
const lastNames = ["Maina", "Kamau", "Ochieng", "Ndungu", "Wambui", "Musa", "Juma", "Karanja", "Mwangi", "Otieno", "Kibet", "Muthoni", "Njoroge", "Githinji", "Anyango", "Atieno", "Okoth", "Kariuki", "Mugo", "Naliaka"];
const locations = ["Nairobi CBD", "Thika Town", "Juja Terminal", "Westlands", "Umoja", "Donholm", "Githurai 45", "Ruiru", "Safari Park", "Mwiki", "Kasarani", "Rongai", "Ngong", "Kitengela", "Syokimau"];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  console.log("🚀 Starting MOS Core Extended Seed Process...");

  try {
    // 1. Sacco Settings
    const saccoId = "s1";
    const sacco: SACCO = {
      id: saccoId,
      name: "Super Metro",
      code: "SMETRO"
    };
    await MOSService.addSaccoSettings(sacco);
    console.log("✅ Sacco Settings established.");

    // 2. 50 Branches
    const branchIds: string[] = [];
    for (let i = 1; i <= 50; i++) {
      const branch: Branch = {
        id: `b${i}`,
        saccoId: saccoId,
        name: `${getRandom(locations)} Station ${i}`,
        location: getRandom(locations)
      };
      await MOSService.addBranch(branch);
      branchIds.push(branch.id);
    }
    console.log(`✅ ${branchIds.length} Branches created.`);

    // 3. 200 Crew Members
    let crewCount = 0;
    for (let i = 1; i <= 200; i++) {
      const role = i % 2 === 0 ? 'DRIVER' : 'CONDUCTOR';
      const crew: CrewMember = {
        id: `c${i}`,
        name: `${getRandom(firstNames)} ${getRandom(lastNames)}`,
        role: role as any,
        phone: `2547${Math.floor(10000000 + Math.random() * 90000000)}`,
        trustScore: Math.floor(70 + Math.random() * 30),
        incentiveBalance: Math.floor(Math.random() * 2000)
      };
      await MOSService.addCrew(crew);
      crewCount++;
    }
    console.log(`✅ ${crewCount} Crew Members created.`);

    // 4. 100 Vehicles
    let vehicleCount = 0;
    const vehicleTypes = ["Bus", "Matatu", "Minibus"];
    for (let i = 1; i <= 100; i++) {
      const type = getRandom(vehicleTypes);
      const vehicle: Vehicle = {
        id: `v${i}`,
        plate: `K${getRandom(['C','D','E'])}${getRandom(['A','B','G','T','M'])}${getRandom(['X','Y','Z'])} ${Math.floor(100 + Math.random() * 899)}${getRandom(['A','B','R','Q'])}`,
        saccoId: saccoId,
        branchId: getRandom(branchIds),
        capacity: type === 'Bus' ? 33 : 14,
        type: type,
        lastLocation: getRandom(locations)
      };
      await MOSService.addVehicle(vehicle);
      vehicleCount++;
    }
    console.log(`✅ ${vehicleCount} Vehicles created.`);

    // 5. SMS Metrics
    await MOSService.addSMSMetrics({
      sent: 500,
      delivered: 485,
      failed: 15
    });
    console.log("✅ SMS Metrics seeded (Sent: 500, Delivered: 485, Failed: 15).");

    console.log("\n✨ Seed Process Completed Successfully!");
  } catch (error) {
    console.error("\n❌ Seed Process Failed:");
    console.error(error);
  }
}

seed();

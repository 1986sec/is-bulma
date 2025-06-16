import mongoose from 'mongoose';
import { fakerTR as faker } from '@faker-js/faker';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { Job } from '../models/Job.js'; // Job modeli export const Job olarak tanımlanmış
import { config } from '../config.js';
import { database } from '../database.js';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger.js';

const seedData = async () => {
  try {
    await database.connect();
    logger.info('Veritabanına bağlanıldı. Veriler temizleniyor...');

    // Mevcut verileri temizle (opsiyonel, isterseniz yorum satırı yapın)
    await User.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    logger.info('Mevcut veriler temizlendi.');

    const users = [];
    const companies = [];
    const jobs = [];

    // 1. Yönetici (Admin) Kullanıcı Oluşturma
    const adminUser = new User({
      firstName: 'Yönetici',
      lastName: 'Admin',
      email: 'admin@anlik-eleman.com',
      password: await bcrypt.hash('password123', 10), // Güvenli bir şifre
      role: 'admin',
      isPremium: true,
      profile: {
        title: 'Sistem Yöneticisi',
        bio: faker.lorem.paragraph(),
        location: 'İstanbul, Türkiye',
        skills: ['Yönetim', 'Sistem Analizi', 'Veritabanı Yönetimi'],
      },
    });
    await adminUser.save();
    users.push(adminUser);
    logger.info('Yönetici hesabı oluşturuldu.');

    // 2. İşveren (Company) Kullanıcıları ve Şirketleri Oluşturma
    for (let i = 0; i < 5; i++) {
      const isPremiumCompany = i < 2; // İlk 2 şirket premium
      const companyUser = new User({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        role: 'company',
        isPremium: isPremiumCompany,
        profile: {
          title: 'İşveren',
          bio: faker.lorem.paragraph(),
          location: faker.location.city() + ', Türkiye',
        },
      });
      await companyUser.save();
      users.push(companyUser);

      const company = new Company({
        name: faker.company.name() + ' A.Ş.',
        slug: faker.helpers.slugify(faker.company.name() + ' A.Ş.'),
        description: faker.lorem.paragraphs(2),
        email: companyUser.email,
        phone: faker.phone.number('###-###-####'),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: 'Türkiye',
        industry: faker.commerce.department(),
        size: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '1000+']),
        founded: faker.date.past({ years: 20 }).getFullYear(),
        type: faker.helpers.arrayElement(['company', 'agency', 'startup']),
        status: 'active',
        verified: true,
        featured: isPremiumCompany, // Premium şirketler öne çıkan olacak
        isPremium: isPremiumCompany,
        createdBy: companyUser._id,
      });
      await company.save();
      companies.push(company);
      logger.info(`Şirket ve İşveren hesabı oluşturuldu: ${company.name}`);

      // Şirket için iş ilanları oluşturma
      for (let j = 0; j < (isPremiumCompany ? 5 : 2); j++) { // Premium şirketler daha çok ilan yayınlasın
        const isFeaturedJob = j < 1 && isPremiumCompany; // Premium şirketlerin ilk ilanı öne çıkan olsun
        const job = new Job({
          title: faker.person.jobTitle(),
          company: company._id, // Şirketin ObjectId'ini kullan
          location: faker.location.city() + ', Türkiye',
          type: faker.helpers.arrayElement(['full-time', 'part-time', 'contract', 'internship', 'remote']),
          description: faker.lorem.paragraphs(3),
          requirements: faker.lorem.sentences(3).split('. ').map(s => s.trim()),
          responsibilities: faker.lorem.sentences(3).split('. ').map(s => s.trim()),
          salary: {
            min: faker.number.int({ min: 5000, max: 15000 }),
            max: faker.number.int({ min: 15001, max: 30000 }),
            currency: 'TRY',
          },
          benefits: faker.lorem.words(3).split(' ').map(w => w.trim()),
          skills: faker.lorem.words(5).split(' ').map(w => w.trim()),
          experience: faker.helpers.arrayElement(['entry', 'junior', 'mid', 'senior', 'lead']),
          education: faker.helpers.arrayElement(['high-school', 'associate', 'bachelor', 'master', 'phd']),
          employer: companyUser._id,
          status: 'published',
          featured: isFeaturedJob,
          expiresAt: faker.date.future({ years: 1 }),
        });
        await job.save();
        jobs.push(job);
        logger.info(`İş ilanı oluşturuldu: ${job.title} (${company.name})`);
      }
    }

    // 3. İş Arayan Kullanıcılar Oluşturma
    for (let i = 0; i < 10; i++) {
      const isPremiumJobSeeker = i < 3; // İlk 3 iş arayan premium
      const jobSeekerUser = new User({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        isPremium: isPremiumJobSeeker,
        profile: {
          title: faker.person.jobTitle(),
          bio: faker.lorem.paragraph(),
          location: faker.location.city() + ', Türkiye',
          skills: faker.lorem.words(5).split(' ').map(w => w.trim()),
          experience: [
            {
              company: faker.company.name(),
              position: faker.person.jobTitle(),
              startDate: faker.date.past({ years: 5 }),
              endDate: faker.date.recent({ days: 30 }),
              description: faker.lorem.sentence(),
            },
          ],
          education: [
            {
              school: faker.company.name() + ' Üniversitesi',
              degree: faker.helpers.arrayElement(['Lisans', 'Yüksek Lisans']),
              field: faker.science.chemicalElement().name,
              startDate: faker.date.past({ years: 7 }),
              endDate: faker.date.past({ years: 2 }),
            },
          ],
          languages: [
            { name: 'Türkçe', level: 'Anadil' },
            { name: 'İngilizce', level: faker.helpers.arrayElement(['İyi', 'Orta', 'Akıcı']) },
          ],
        },
      });
      await jobSeekerUser.save();
      users.push(jobSeekerUser);
      logger.info(`İş arayan hesabı oluşturuldu: ${jobSeekerUser.firstName} ${jobSeekerUser.lastName}`);
    }

    // Özel ilan örneği (Ankara/Mamak yevmiye ile çalışacak vasıflı eleman)
    const mamakCompanyUser = new User({
      firstName: 'Mamak İnşaat',
      lastName: 'Yönetimi',
      email: 'mamakinsaat@anlik-eleman.com',
      password: await bcrypt.hash('password123', 10),
      role: 'company',
      isPremium: true,
      profile: {
        title: 'Mamak İnşaat İşveren',
        location: 'Ankara, Türkiye',
      },
    });
    await mamakCompanyUser.save();
    users.push(mamakCompanyUser);

    const mamakCompany = new Company({
      name: 'Mamak İnşaat ve Tadilat',
      slug: 'mamak-insaat-ve-tadilat',
      description: 'Ankara Mamak bölgesinde inşaat ve tadilat hizmetleri sunan öncü bir firmayız.',
      email: mamakCompanyUser.email,
      phone: '0555-123-4567',
      address: 'Mamak, Ankara',
      city: 'Ankara',
      country: 'Türkiye',
      industry: 'İnşaat',
      size: '11-50',
      founded: 2005,
      type: 'company',
      status: 'active',
      verified: true,
      featured: true,
      isPremium: true,
      createdBy: mamakCompanyUser._id,
    });
    await mamakCompany.save();
    companies.push(mamakCompany);
    logger.info(`Özel şirket oluşturuldu: ${mamakCompany.name}`);

    const mamakJob = new Job({
      title: 'Vasıflı İnşaat Elemanı Aranıyor',
      company: mamakCompany._id,
      location: 'Ankara, Mamak, Türkiye',
      type: 'contract',
      description: 'Ankara Mamak bölgesindeki şantiyelerimizde yevmiye ile çalışacak vasıflı inşaat elemanları arıyoruz. Deneyimli ve sorumluluk sahibi adaylar tercih edilecektir.',
      requirements: ['İnşaat deneyimi', 'Takım çalışmasına yatkınlık', 'Fiziksel yeterlilik'],
      responsibilities: ['İnşaat sahasında verilen görevleri yerine getirmek', 'Güvenlik kurallarına uymak'],
      salary: {
        min: 1500,
        max: 2000,
        currency: 'TRY',
      },
      benefits: ['Yemek', 'SGK'],
      skills: ['İnşaat', 'Tadilat', 'Ustalık'],
      experience: 'mid',
      education: 'high-school',
      employer: mamakCompanyUser._id,
      status: 'published',
      featured: true, // Öne çıkan ilan
      expiresAt: faker.date.future({ years: 1 }),
      tags: ['yevmiye', 'Ankara', 'Mamak', 'vasıflı eleman', 'inşaat'],
    });
    await mamakJob.save();
    jobs.push(mamakJob);
    logger.info(`Özel iş ilanı oluşturuldu: ${mamakJob.title}`);


    logger.info('Veritabanı başarıyla dolduruldu!');
    logger.info(`Toplam ${users.length} kullanıcı, ${companies.length} şirket ve ${jobs.length} iş ilanı oluşturuldu.`);

  } catch (error) {
    logger.error('Veri doldurma hatası:', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await database.disconnect();
    logger.info('Veritabanı bağlantısı kapatıldı.');
    process.exit(0);
  }
};

seedData(); 
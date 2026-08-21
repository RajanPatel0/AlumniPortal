import { prisma } from '../src/lib/prisma';

async function seed() {
  const existing = await prisma.event.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} events. Skipping seed.`);
    return;
  }

  const now = new Date();

  // Create 3 upcoming events relative to current time
  const date1 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000); // ~12 days 4 hours
  const date2 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000); // ~28 days 7 hours
  const date3 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000); // ~45 days 2 hours

  const eventsData = [
    {
      title: 'Universities admission conference 2026',
      description: 'Annual university admission conference bringing together prospective students, alumni mentors, academic advisors, and industry pioneers for insightful career talks.',
      category: 'Conference',
      eventDate: date1,
      venue: 'Main Auditorium, IKGPTU Main Campus',
      coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      showOnLanding: true,
    },
    {
      title: 'History and culture open day conference 2026',
      description: 'Celebrating our rich university heritage and cultural achievements through keynotes, art exhibitions, and interactive student-alumni showcases.',
      category: 'Conference',
      eventDate: date2,
      venue: 'Heritage Hall, Amritsar Campus',
      coverImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      showOnLanding: true,
    },
    {
      title: 'Undergraduate and postgraduate open days 2026',
      description: 'Explore academic departments, research labs, startup incubation centers, and network with distinguished alumni leaders from across the nation.',
      category: 'Conference',
      eventDate: date3,
      venue: 'Central Plaza, Mohali Campus',
      coverImageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      showOnLanding: true,
    },
  ];

  for (const item of eventsData) {
    await prisma.event.create({ data: item });
  }

  console.log('Successfully seeded 3 upcoming events into database!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

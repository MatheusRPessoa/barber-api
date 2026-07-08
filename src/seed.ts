import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User, UserType } from './users/entities/user.entity';
import { Barber } from './barbers/entities/barber.entity';
import { Client } from './clients/entities/client.entity';
import { Service } from './services/entities/service.entity';
import {
  Appointment,
  AppointmentStatus,
} from './appointments/entities/appointment.entity';
import { Coupon } from './coupons/entities/coupon.entity';
import { Review } from './reviews/entities/review.entity';

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().split('T')[0];
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const ds = app.get(DataSource);

  await ds.query(
    `TRUNCATE TABLE reviews, coupon_redemptions, coupons, appointments,
     services, clients, barbers, users RESTART IDENTITY CASCADE`,
  );

  const usersRepo = ds.getRepository(User);
  const barbersRepo = ds.getRepository(Barber);
  const clientsRepo = ds.getRepository(Client);
  const servicesRepo = ds.getRepository(Service);
  const appointmentsRepo = ds.getRepository(Appointment);
  const couponsRepo = ds.getRepository(Coupon);
  const reviewsRepo = ds.getRepository(Review);

  const password = await bcrypt.hash('123456', 10);

  const address = {
    STREET: 'Rua das Flores',
    NUMBER: '123',
    NEIGHBORHOOD: 'Centro',
    CITY: 'São Paulo',
    STATE: 'SP',
    ZIP_CODE: '01310-100',
  };

  async function createBarber(
    name: string,
    email: string,
    shop: string,
    cnpj: string,
    lat: number,
    lng: number,
    serviceDefs: [string, number, number][],
  ) {
    const user = await usersRepo.save(
      usersRepo.create({
        NAME: name,
        EMAIL: email,
        PASSWORD: password,
        TYPE: UserType.BARBER,
      }),
    );
    const barber = await barbersRepo.save(
      barbersRepo.create({
        SHOP_NAME: shop,
        CNPJ: cnpj,
        LATITUDE: lat,
        LONGITUDE: lng,
        USER: user,
        ...address,
      }),
    );
    const services = await servicesRepo.save(
      serviceDefs.map(([sName, price, duration]) =>
        servicesRepo.create({
          NAME: sName,
          PRICE: price,
          DURATION_MINUTES: duration,
          BARBER: barber,
        }),
      ),
    );
    return { barber, services };
  }

  async function createClient(name: string, email: string, cpf: string) {
    const user = await usersRepo.save(
      usersRepo.create({
        NAME: name,
        EMAIL: email,
        PASSWORD: password,
        TYPE: UserType.CLIENT,
      }),
    );
    await clientsRepo.save(
      clientsRepo.create({ CPF: cpf, USER: user, ...address }),
    );
    return user;
  }

  const b1 = await createBarber(
    'João Silva',
    'joao@barber.com',
    'Barbearia do João',
    '12.345.678/0001-90',
    -23.5505,
    -46.6333,
    [
      ['Corte de cabelo', 35, 30],
      ['Barba', 25, 20],
    ],
  );
  const b2 = await createBarber(
    'Carlos Souza',
    'carlos@barber.com',
    'Navalha de Ouro',
    '98.765.432/0001-10',
    -23.56,
    -46.65,
    [
      ['Corte degradê', 40, 40],
      ['Sobrancelha', 15, 10],
    ],
  );
  // Barbearia nova: sem agendamentos e sem reviews → rating null (badge "Novo")
  await createBarber(
    'Pedro Lima',
    'pedro@barber.com',
    'Corte & Estilo',
    '11.222.333/0001-44',
    -23.54,
    -46.62,
    [['Corte simples', 30, 30]],
  );

  const c1 = await createClient(
    'Maria Santos',
    'maria@email.com',
    '123.456.789-09',
  );
  const c2 = await createClient(
    'José Oliveira',
    'jose@email.com',
    '987.654.321-00',
  );

  async function createAppointment(
    barber: Barber,
    services: Service[],
    client: User,
    daysAgo: number,
    time: string,
    status: AppointmentStatus,
  ) {
    return appointmentsRepo.save(
      appointmentsRepo.create({
        BARBER: barber,
        CLIENT: client,
        SERVICES: services,
        DATE: daysFromNow(-daysAgo),
        TIME: time,
        APPOINTMENT_STATUS: status,
      }),
    );
  }

  // Barbearia 1: 6 agendamentos nos últimos 30 dias (lidera o trending)
  const b1Completed = [
    await createAppointment(
      b1.barber,
      b1.services,
      c1,
      3,
      '10:00',
      AppointmentStatus.COMPLETED,
    ),
    await createAppointment(
      b1.barber,
      [b1.services[0]],
      c2,
      7,
      '11:00',
      AppointmentStatus.COMPLETED,
    ),
    await createAppointment(
      b1.barber,
      b1.services,
      c1,
      14,
      '15:00',
      AppointmentStatus.COMPLETED,
    ),
    await createAppointment(
      b1.barber,
      [b1.services[1]],
      c2,
      20,
      '09:30',
      AppointmentStatus.COMPLETED,
    ),
  ];
  await createAppointment(
    b1.barber,
    b1.services,
    c1,
    1,
    '16:00',
    AppointmentStatus.CONFIRMED,
  );
  await createAppointment(
    b1.barber,
    [b1.services[0]],
    c2,
    2,
    '17:00',
    AppointmentStatus.CONFIRMED,
  );

  // Barbearia 2: 3 agendamentos nos últimos 30 dias
  const b2Completed = [
    await createAppointment(
      b2.barber,
      b2.services,
      c1,
      5,
      '10:30',
      AppointmentStatus.COMPLETED,
    ),
    await createAppointment(
      b2.barber,
      [b2.services[0]],
      c2,
      12,
      '14:00',
      AppointmentStatus.COMPLETED,
    ),
    await createAppointment(
      b2.barber,
      [b2.services[1]],
      c1,
      25,
      '11:30',
      AppointmentStatus.COMPLETED,
    ),
  ];

  // Agendamento futuro pendente (tela "meus agendamentos" do cliente)
  await appointmentsRepo.save(
    appointmentsRepo.create({
      BARBER: b1.barber,
      CLIENT: c1,
      SERVICES: [b1.services[0]],
      DATE: daysFromNow(3),
      TIME: '10:00',
      APPOINTMENT_STATUS: AppointmentStatus.PENDING,
    }),
  );

  // Reviews (só em COMPLETED). B1 → média 4.8; B2 → média 3.3
  async function createReview(
    appointment: Appointment,
    barber: Barber,
    client: User,
    rating: number,
    comment: string | null,
  ) {
    await reviewsRepo.save(
      reviewsRepo.create({
        RATING: rating,
        COMMENT: comment,
        APPOINTMENT: appointment,
        BARBER: barber,
        CLIENT: client,
      }),
    );
  }

  await createReview(
    b1Completed[0],
    b1.barber,
    c1,
    5,
    'Excelente atendimento!',
  );
  await createReview(
    b1Completed[1],
    b1.barber,
    c2,
    5,
    'Melhor corte da região',
  );
  await createReview(
    b1Completed[2],
    b1.barber,
    c1,
    4,
    'Muito bom, só demorou um pouco',
  );
  await createReview(b1Completed[3], b1.barber, c2, 5, null);

  await createReview(b2Completed[0], b2.barber, c1, 4, 'Bom custo-benefício');
  await createReview(b2Completed[1], b2.barber, c2, 3, 'Atendimento ok');
  await createReview(b2Completed[2], b2.barber, c1, 3, null);

  // Rating = média das reviews com 1 casa (nada de placeholder fixo)
  for (const barber of [b1.barber, b2.barber]) {
    const raw = await reviewsRepo
      .createQueryBuilder('r')
      .innerJoin('r.BARBER', 'b')
      .select('AVG(r.RATING)', 'avg')
      .where('b.ID = :id', { id: barber.ID })
      .getRawOne<{ avg: string | null }>();
    const rating =
      raw?.avg != null ? Math.round(parseFloat(raw.avg) * 10) / 10 : null;
    await barbersRepo.update({ ID: barber.ID }, { RATING: rating });
  }

  // Cupons: 2 válidos (B1) + 1 expirado (B2, para testar o 400)
  await couponsRepo.save([
    couponsRepo.create({
      CODE: 'PROMO10',
      DISCOUNT_PERCENT: 10,
      VALID_UNTIL: daysFromNow(15),
      BARBER: b1.barber,
    }),
    couponsRepo.create({
      CODE: 'CORTE20',
      DISCOUNT_PERCENT: 20,
      VALID_UNTIL: daysFromNow(7),
      BARBER: b1.barber,
    }),
    couponsRepo.create({
      CODE: 'EXPIRADO',
      DISCOUNT_PERCENT: 30,
      VALID_UNTIL: daysFromNow(-5),
      BARBER: b2.barber,
    }),
  ]);

  console.log('Seed concluído.');
  console.log(
    'Logins (senha 123456): joao@barber.com, carlos@barber.com, pedro@barber.com, maria@email.com, jose@email.com',
  );
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

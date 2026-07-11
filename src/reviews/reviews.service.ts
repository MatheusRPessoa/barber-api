import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { In, Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private repo: Repository<Review>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Barber) private barbersRepo: Repository<Barber>,
  ) {}

  async create(
    appointmentId: string,
    clientUserId: string,
    dto: CreateReviewDto,
  ) {
    const appointment = await this.appointmentsRepo.findOne({
      where: { ID: appointmentId },
      relations: { CLIENT: true, BARBER: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.CLIENT?.ID !== clientUserId)
      throw new ForbiddenException('You can only review your own appointments');
    if (appointment.APPOINTMENT_STATUS !== AppointmentStatus.COMPLETED)
      throw new BadRequestException('Appointment not completed');

    const existing = await this.repo.findOne({
      where: { APPOINTMENT: { ID: appointmentId } },
    });
    if (existing) throw new ConflictException('Appointment already reviewed');

    const review = await this.repo.save(
      this.repo.create({
        RATING: dto.RATING,
        COMMENT: dto.COMMENT ?? null,
        APPOINTMENT: appointment,
        CLIENT: appointment.CLIENT,
        BARBER: appointment.BARBER,
      }),
    );

    await this.recalcBarberRating(appointment.BARBER.ID);

    return {
      id: review.ID,
      rating: review.RATING,
      comment: review.COMMENT,
      created_at: review.CRIADO_EM,
    };
  }

  async findByBarber(barberId: string) {
    const barber = await this.barbersRepo.findOne({ where: { ID: barberId } });
    if (!barber) throw new NotFoundException('Barber not found');

    const reviews = await this.repo.find({
      where: { BARBER: { ID: barberId } },
      relations: { CLIENT: true },
      order: { CRIADO_EM: 'DESC' },
    });

    return reviews.map((r) => ({
      id: r.ID,
      rating: r.RATING,
      comment: r.COMMENT,
      created_at: r.CRIADO_EM,
      client: { name: r.CLIENT.NAME },
    }));
  }

  async reviewsByAppointmentIds(
    appointmentIds: string[],
  ): Promise<
    Map<string, { rating: number; comment: string | null; created_at: Date }>
  > {
    if (appointmentIds.length === 0) return new Map();
    const reviews = await this.repo.find({
      where: { APPOINTMENT: { ID: In(appointmentIds) } },
      relations: { APPOINTMENT: true },
    });
    return new Map(
      reviews.map((r) => [
        r.APPOINTMENT.ID,
        { rating: r.RATING, comment: r.COMMENT, created_at: r.CRIADO_EM },
      ]),
    );
  }

  async recalcBarberRating(barberId: string) {
    const raw = await this.repo
      .createQueryBuilder('r')
      .innerJoin('r.BARBER', 'b')
      .select('AVG(r.RATING)', 'avg')
      .where('b.ID = :barberId', { barberId })
      .getRawOne<{ avg: string | null }>();

    const rating =
      raw?.avg != null ? Math.round(parseFloat(raw.avg) * 10) / 10 : null;

    await this.barbersRepo.update({ ID: barberId }, { RATING: rating });
  }
}

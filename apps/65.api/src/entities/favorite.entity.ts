import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Hike } from './hike.entity';
import { User } from './user.entity';

@Entity('Favorite')
export class Favorite {
  @PrimaryColumn('varchar', { length: 255 })
  userId: string;

  @PrimaryColumn('varchar', { length: 255 })
  hikeId: string;

  // Relation Many-to-One vers User
  @ManyToOne(() => User, (user) => user.favorites)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Relation Many-to-One vers Hike
  @ManyToOne(() => Hike, (hike) => hike.favorites)
  @JoinColumn({ name: 'hikeId' })
  hike: Hike;
}

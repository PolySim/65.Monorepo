import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Hike } from './hike.entity';

@Entity('Image')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  path: string;

  @Column('varchar', { length: 255 })
  hikeId: string;

  @Column('integer')
  ordered: number;

  @Column('integer', { default: 0, nullable: true })
  rotate: number;

  // Relation Many-to-One : plusieurs images appartiennent à une randonnée
  @ManyToOne(() => Hike, (hike) => hike.images)
  @JoinColumn({ name: 'hikeId' })
  hike: Hike;

  // Relation inverse : une image peut être l'image principale d'une randonnée
  @OneToOne(() => Hike, (hike) => hike.mainImage)
  hikeAsMainImage: Hike;
}

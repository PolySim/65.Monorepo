import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Hike } from './hike.entity';

@Entity('HikeGPX')
export class HikeGPX {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 255 })
  path: string;

  @Column('varchar', { length: 255 })
  hikeId: string;

  // Relation Many-to-One : plusieurs fichiers GPX peuvent appartenir à une randonnée
  @ManyToOne(() => Hike, (hike) => hike.gpxFiles)
  @JoinColumn({ name: 'hikeId' })
  hike: Hike;
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Hike } from './hike.entity';

@Entity('Difficulty')
export class Difficulty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  // Relation inverse : une difficulté peut avoir plusieurs randonnées
  @OneToMany(() => Hike, (hike) => hike.difficulty)
  hikes: Hike[];
}

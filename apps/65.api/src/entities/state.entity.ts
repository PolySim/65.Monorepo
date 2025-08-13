import { Entity, PrimaryColumn, Column, ManyToMany } from 'typeorm';
import { Category } from './category.entity';

@Entity('State')
export class State {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, nullable: true })
  image_path: string;

  @ManyToMany(() => Category, (category) => category.states)
  categories: Category[];
}

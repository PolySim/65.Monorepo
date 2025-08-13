import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('UserRole')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  // Relation inverse : un rôle peut avoir plusieurs utilisateurs
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}

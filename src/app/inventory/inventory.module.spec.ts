import { InventoryModule } from './inventory.module';

describe('RepairModule', () => {
  let inventoryModule: InventoryModule;

  beforeEach(() => {
    inventoryModule = new InventoryModule();
  });

  it('should create an instance', () => {
    expect(inventoryModule).toBeTruthy();
  });
});
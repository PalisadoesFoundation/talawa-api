// import fs from 'fs';
// import dotenv from 'dotenv';
// import { vi, describe, it, expect } from 'vitest';
// import { setNodeEnvironment } from '../../setup';
// import * as module from '../../setup'

// const mockSetup = vi.mock('../../setup', () => {
//   const getNodeEnvironment = vi.fn().mockResolvedValue('developmnt');
//   return {
//     default: getNodeEnvironment,
//     setNodeEnvironment
//   };
// });

// describe('setNodeEnvironment', () => {
//   it('should set NODE_ENV to "development" and update .env file', async () => {
//     // vi.spyOn(global.process, 'env', 'set').mockReturnValueOnce();
//     vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('');
//     vi.spyOn(dotenv, 'parse').mockReturnValueOnce({});

//     const mock = vi.mocked(module)
//     await mock.setNodeEnvironment()

//     expect(mock.getNodeEnvironment).toBeCalled()
//     expect(process.env.NODE_ENV).toBe('test');
//     // expect(fs.readFileSync).toHaveBeenCalledWith('.env');
//     // expect(fs.writeFileSync).toHaveBeenCalledWith('.env', 'NODE_ENV=development\n');
//   });
// });

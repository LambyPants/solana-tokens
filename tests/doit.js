const anchor = require('@project-serum/anchor');
const spl = require('@solana/spl-token');
const { SystemProgram } = anchor.web3;
// Read the generated IDL.

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(
  'FWkWQF76FmLgvie915MUSd6SmqoDkaaZJeU2B4vxguw7',
);
anchor.setProvider(anchor.Provider.local('https://api.devnet.solana.com'));

console.log({ programId });
// Configure the local cluster.
async function doIt() {
  const idl = JSON.parse(
    require('fs').readFileSync('../target/idl/dosolana.json', 'utf8'),
  );
  console.log({ idl });

  // Generate the program client from IDL.
  const program = new anchor.Program(idl, programId);
  console.log('program: ', program);

  // Execute the RPC.
  // await program.rpc.initialize();

  // Before sending the transaction to the blockchain.
  const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress(
    [],
    program.programId,
  );

  /* metaplex program */
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  );
  console.log({ mint, mintBump });
  const [metaddress, metabump] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  console.log(
    'asdas',
    { mint, mintBump },
    metaddress.toString(),
    mint.toString(),
  );

  let ourAssociatedTokens = await spl.getAssociatedTokenAddress(
    mint,
    program.provider.wallet.publicKey,
    true,
    spl.TOKEN_PROGRAM_ID,
    spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  console.log(
    spl.TOKEN_PROGRAM_ID.toString(),
    spl.ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
  );

  console.log({ ourAssociatedTokens: ourAssociatedTokens.toString() });
  const message = anchor.web3.Keypair.generate();
  await program.rpc.initMint(mintBump, {
    accounts: {
      mint: mint,
      payer: program.provider.wallet.publicKey,
      metadata: metaddress,
      destination: ourAssociatedTokens,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintAuthority: message.publicKey,
      tokenProgram: spl.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    },
    signers: [message],
  });
}

doIt();

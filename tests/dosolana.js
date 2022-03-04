const anchor = require('@project-serum/anchor');
const spl = require('@solana/spl-token');
const mpl = require('@metaplex-foundation/mpl-token-metadata');

describe('dosolana', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.Dosolana;

  async function fetchMint(address) {
    let mintAccountInfo = await program.provider.connection.getAccountInfo(
      address,
    );
    return spl.MintLayout.decode(mintAccountInfo.data);
  }

  async function fetchTokenAccount(address) {
    let tokenAccountInfo = await program.provider.connection.getAccountInfo(
      address,
    );
    return spl.AccountLayout.decode(tokenAccountInfo.data);
  }

  it('can send a new tweet', async () => {
    // Before sending the transaction to the blockchain.
    const message = anchor.web3.Keypair.generate();
    console.log('message: ', message);

    await program.rpc.writeMessage('Beautiful message so insight', {
      accounts: {
        message: message.publicKey,
        creator: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [message],
    });
    // Fetch the account details of the created tweet.
    const messageAccount = await program.account.message.fetch(
      message.publicKey,
    );
    console.log(messageAccount);
  });

  it('can init mint', async () => {
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
    const [metaddress, metabump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          mpl.MetadataProgram.PUBKEY.toBuffer(),
          mint.toBuffer(),
        ],
        program.programId,
      );
    console.log({ mint, mintBump }, mpl.MetadataProgram.PUBKEY);

    let ourAssociatedTokens = await spl.getAssociatedTokenAddress(
      mint,
      program.provider.wallet.publicKey,
      true,
      spl.TOKEN_PROGRAM_ID,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    );


    console.log(spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

    console.log({ ourAssociatedTokens });
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

    let nicelyParsedMint = await fetchMint(mint);
    let nicelyParsedDestinationRightAfterMint = await fetchTokenAccount(
      ourAssociatedTokens,
    );
    console.log({ nicelyParsedMint, nicelyParsedDestinationRightAfterMint });
  });

  // it('can init raw mint', async () => {
  //   // Before sending the transaction to the blockchain.
  //   const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress(
  //     [],
  //     program.programId,
  //   );
  //   console.log({ mint, mintBump });

  //   console.log(spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

  //   await program.rpc.initRaw(mintBump, {
  //     accounts: {
  //       mint: mint,
  //       payer: program.provider.wallet.publicKey,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: spl.TOKEN_PROGRAM_ID,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //   });

  //   let nicelyParsedMint = await fetchMint(mint);
  //   console.log({ nicelyParsedMint });
  // });

  // it('can airdrop from mint', async () => {
  //   // Before sending the transaction to the blockchain.
  //   const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress(
  //     [],
  //     program.programId,
  //   );
  //   console.log({ mint, mintBump });

  //   let ourAssociatedTokens = await spl.getAssociatedTokenAddress(
  //     mint,
  //     program.provider.wallet.publicKey,
  //     true,
  //     spl.TOKEN_PROGRAM_ID,
  //     spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //   );

  //   console.log(spl.TOKEN_PROGRAM_ID, spl.ASSOCIATED_TOKEN_PROGRAM_ID);

  //   console.log({ ourAssociatedTokens });

  //   await program.rpc.airdrop(mintBump, {
  //     accounts: {
  //       mint: mint,
  //       payer: program.provider.wallet.publicKey,
  //       destination: ourAssociatedTokens,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: spl.TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //   });

  //   let nicelyParsedMint = await fetchMint(mint);
  //   let nicelyParsedDestinationRightAfterMint = await fetchTokenAccount(
  //     ourAssociatedTokens,
  //   );
  //   console.log({ nicelyParsedMint, nicelyParsedDestinationRightAfterMint });
  // })
});

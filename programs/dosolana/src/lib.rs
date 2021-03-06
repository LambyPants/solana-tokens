use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

impl Message {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
}

#[program]
pub mod dosolana {
    use super::*;
    pub fn write_message(ctx: Context<WriteMessage>, content: String) -> Result<()> {
        let message: &mut Account<Message> = &mut ctx.accounts.message;
        let creator: &Signer = &ctx.accounts.creator;
        let clock: Clock = Clock::get().unwrap();

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        message.creator = *creator.key;
        message.timestamp = clock.unix_timestamp;
        message.content = content;

        Ok(())
    }

    pub fn init_mint(ctx: Context<InitMint>, mint_bump: u8) -> Result<()> {
        println!("my mint bump {}", mint_bump);
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                &[&[&[], &[mint_bump]]],
            ),
            5,
        )?;
        Ok(())
    }

    pub fn init_raw(ctx: Context<InitRaw>, mint_bump: u8) -> Result<()> {
        println!("my mint bump {}", mint_bump);
        Ok(())
    }

    pub fn airdrop(ctx: Context<AirDrop>, mint_bump: u8) -> Result<()> {
        msg!("my mint bump {}", mint_bump);
        msg!(
            "{} tokens have been minted so far...",
            ctx.accounts.mint.supply
        );
        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                &[&[&[], &[mint_bump]]],
            ),
            5,
        )?;

        ctx.accounts.mint.reload()?;

        msg!(
            "{} tokens have been minted so far...",
            ctx.accounts.mint.supply
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct WriteMessage<'info> {
    #[account(init, payer = creator, space = Message::LEN)]
    pub message: Account<'info, Message>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(mint_bump: u8)]
pub struct InitMint<'info> {
    #[account(
    init,
    payer = payer,
    mint::decimals = 1,
    seeds = [],
    bump,
    mint::authority = mint,
    mint::freeze_authority = payer
)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, associated_token::mint = mint, associated_token::authority = payer)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}
#[derive(Accounts)]
#[instruction(mint_bump: u8)]
pub struct InitRaw<'info> {
    #[account(
    init,
    payer = payer,
    mint::decimals = 1,
    seeds = [],
    bump,
    mint::authority = mint,
    mint::freeze_authority = payer
)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AirDrop<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(init, payer = payer, associated_token::mint = mint, associated_token::authority = payer)]
    pub destination: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Message {
    pub creator: Pubkey,
    pub timestamp: i64,
    pub content: String, // max of 800 bytes == 200 chars
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
}

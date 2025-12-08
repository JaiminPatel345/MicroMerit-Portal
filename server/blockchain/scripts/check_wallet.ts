import { ethers } from 'ethers';

const privateKey = process.env.PRIVATE_KEY || 'a722814bcdae93f0a84ad619e7566952cf55a3579a690edd4f088d58c144d969';
const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/a6cebbe076e842749173b4f2af8bf95c';

async function checkWallet() {
    try {
        // Create wallet from private key
        const wallet = new ethers.Wallet(privateKey);
        const address = wallet.address;

        console.log('\n💼 Wallet Information:');
        console.log('  Address:', address);

        // Connect to Sepolia
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Check balance
        const balance = await provider.getBalance(address);
        const balanceInEth = ethers.formatEther(balance);

        console.log('  Balance:', balanceInEth, 'SepoliaETH');
        console.log('  Wei:', balance.toString());

        if (parseFloat(balanceInEth) === 0) {
            console.log('\n❌ Wallet has ZERO balance!');
            console.log('   You need Sepolia ETH to write to blockchain.');
            console.log('   Get free Sepolia ETH from:');
            console.log('   - https://sepoliafaucet.com/');
            console.log('   - https://www.alchemy.com/faucets/ethereum-sepolia');
            console.log('   - https://faucet.quicknode.com/ethereum/sepolia');
        } else {
            console.log('\n✅ Wallet has sufficient balance for transactions');
        }

        // Check contract
        const contractAddress = process.env.CONTRACT_ADDRESS || '0xa5A36eB55522FD75e6153d45D17416AbfFD57976';
        const code = await provider.getCode(contractAddress);

        if (code === '0x') {
            console.log('\n❌ Contract NOT deployed at', contractAddress);
        } else {
            console.log('\n✅ Contract deployed at', contractAddress);
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

checkWallet();

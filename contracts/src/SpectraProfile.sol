// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SpectraProfile {
    struct User {
        string name;
        string email;
        string phone;
        string bio;
        uint8 avatarId;
        bool exists;
    }

    mapping(address => User) private profiles;

    event ProfileCreated(address indexed user);
    event ProfileUpdated(address indexed user);
    event ProfileDeleted(address indexed user);

    modifier onlyValidAvatar(uint8 _avatarId) {
        require(_avatarId >= 1 && _avatarId <= 6, "Avatar ID must be between 1 and 6");
        _;
    }

    modifier profileExists() {
        require(profiles[msg.sender].exists, "Profile does not exist");
        _;
    }

    function createProfile(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _bio,
        uint8 _avatarId
    ) external onlyValidAvatar(_avatarId) {
        require(!profiles[msg.sender].exists, "Profile already exists");

        profiles[msg.sender] = User({
            name: _name,
            email: _email,
            phone: _phone,
            bio: _bio,
            avatarId: _avatarId,
            exists: true
        });

        emit ProfileCreated(msg.sender);
    }

    function getProfile(address _user) external view returns (User memory) {
        return profiles[_user];
    }

    function updateProfile(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _bio,
        uint8 _avatarId
    ) external profileExists onlyValidAvatar(_avatarId) {
        User storage user = profiles[msg.sender];
        user.name = _name;
        user.email = _email;
        user.phone = _phone;
        user.bio = _bio;
        user.avatarId = _avatarId;

        emit ProfileUpdated(msg.sender);
    }

    function deleteProfile() external profileExists {
        delete profiles[msg.sender];
        emit ProfileDeleted(msg.sender);
    }
}
